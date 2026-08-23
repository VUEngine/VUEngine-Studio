/**
 * Collecting a profile by replaying a recorded session.
 *
 * The Virtual Boy's emulation is bit-deterministic (§2 of the rewrite plan), so
 * a session can be reproduced exactly from the machine's state when recording
 * began plus the input it was given. Replaying it with an execute callback
 * gives an *exhaustive* profile — every instruction, no sampling error — and,
 * because the call stack is rebuilt from the calls and returns the replay sees
 * rather than unwound from frames, it works on the optimised, frame-pointer-less
 * builds a project actually ships. See §6.3.
 *
 * Nothing here runs the machine. It takes the stream of program counters a
 * replay produces and turns it into a call tree; driving the core is the
 * worker's job, and converting the result for Firefox Profiler is
 * `toFirefoxProfile` at the end.
 */

/** What an instruction does to the call stack. */
export const enum VesInstructionKind {
    OTHER = 0,
    /** JAL: pushes a frame. */
    CALL = 1,
    /**
     * JMP [r31], the ordinary return.
     *
     * Decoded but no longer acted on: it turned out to miss about one return in
     * thirty on real code — see `returnTo` — so frames are closed by arriving
     * at their return address instead, which catches every way out. Kept
     * because it says what the instruction is, and a future consumer may want
     * to know.
     */
    RETURN = 2,
}

/** V810 opcodes, in the top six bits of the first halfword. */
const OP_JMP = 0b000110;
const OP_JAL = 0b101011;
/** The register JAL writes the return address into, and JMP returns through. */
const LINK_REGISTER = 31;

/**
 * Work out what every instruction in a ROM does to the call stack, once.
 *
 * A replay reads no instruction back out of the machine: the ROM cannot change
 * while it runs, so this is knowable up front. Measured at 2.6 ms for a 1 MB
 * ROM, and it takes the per-instruction cost of maintaining a call stack from
 * 1.34x down to 1.13x — see §6.3.
 *
 * Indexed by halfword, since that is the smallest an instruction can be.
 */
export function decodeRomKinds(rom: Uint8Array): Uint8Array {
    const kinds = new Uint8Array(rom.byteLength >> 1);
    const view = new DataView(rom.buffer, rom.byteOffset, rom.byteLength);
    for (let at = 0; at + 1 < rom.byteLength; at += 2) {
        const word = view.getUint16(at, true);
        const opcode = word >>> 10;
        kinds[at >> 1] = opcode === OP_JAL
            ? VesInstructionKind.CALL
            : opcode === OP_JMP && (word & 0x1f) === LINK_REGISTER
                ? VesInstructionKind.RETURN
                : VesInstructionKind.OTHER;
    }
    return kinds;
}

/** A node of the collected call tree. */
export interface VesProfileNode {
    /** Index into the collector's `nodes`, and this node's own id. */
    id: number;
    /** The node this was called from, or -1 at the root. */
    parent: number;
    /**
     * The address called to reach this frame — the callee's entry point, which
     * is what names the function. -1 for the root.
     */
    address: number;
    /** Instructions executed in this frame itself, excluding anything it called. */
    selfSamples: number;
    /** Instructions executed here and in everything below it. */
    totalSamples: number;
    children: Map<number, number>;
}

/**
 * Where the machine begins, and begins again.
 *
 * Arriving here means the machine restarted, which abandons every frame that
 * was open — a reset is not a return, and nothing below `main` will ever come
 * back. Without this, a game that reboots (a watchdog firing, a crash, a title
 * screen timing out) records each life nested inside the last, and the tree
 * fills with a chain of identical frames instead of showing a program that ran
 * several times.
 */
const RESET_VECTOR = 0xfffffff0;

/**
 * How deep a call stack may get before the collector stops pushing.
 *
 * A runaway stack means the replay has lost sync with reality, and the useful
 * response is to stop growing rather than to consume memory describing it.
 */
const MAX_DEPTH = 256;

/**
 * Turns a replay's program counters into a call tree.
 *
 * Feed it every instruction in order. It keeps a shadow stack of the frames
 * entered so far and charges each instruction to whichever frame is on top, so
 * `selfSamples` is time in a function proper and `totalSamples` is time in it
 * and everything it called.
 */
export class VesProfileCollector {

    /** The tree, with node 0 as the root everything hangs off. */
    readonly nodes: VesProfileNode[] = [{
        id: 0, parent: -1, address: -1, selfSamples: 0, totalSamples: 0, children: new Map(),
    }];

    /** Node ids from the root down to the frame currently executing. */
    protected readonly stack: number[] = [0];
    /**
     * Where each frame on the stack is expected to return to.
     *
     * A call is not always undone by the instruction the plan assumed. Over
     * sixty frames of a real game: 3,800 `jal` against 3,667 `jmp [r31]`, with
     * the rest returning through `jmp` on some other register, through `reti`,
     * or not at all. Watching only for `jmp [r31]` leaks about two frames per
     * game frame, which buries the stack within seconds.
     *
     * So the return address is what actually decides: whenever execution
     * arrives at the address a frame said it would return to, that frame is
     * done, however it got there.
     */
    protected readonly returnTo: number[] = [-1];
    /** Set by a call, resolved on the next instruction — see `push`. */
    protected pendingReturn = -1;
    protected overflowed = 0;
    protected instructions = 0;
    protected resets = 0;

    /**
     * Charge one instruction, and follow it if it enters or leaves a frame.
     *
     * The kind is looked up by the caller, which has the decoded table and the
     * address already; passing it in keeps this loop free of any indexing it
     * does not have to do.
     *
     * @param address where the instruction is, in whatever window the machine
     *     reports — the collector only ever compares these to each other
     * @param kind what it does to the stack
     */
    push(address: number, kind: VesInstructionKind): void {
        if ((address >>> 0) === RESET_VECTOR) {
            // Everything that was running is gone. Charge the reset itself to
            // the root, which is where the next life starts from.
            this.stack.length = 1;
            this.returnTo.length = 1;
            this.pendingReturn = -1;
            this.resets++;
        }

        // A call's target is only known once the next instruction arrives, so
        // the frame is entered here rather than when the call was seen.
        if (this.pendingReturn >= 0) {
            this.enter(address, this.pendingReturn);
            this.pendingReturn = -1;
        } else {
            this.unwindTo(address);
        }

        this.instructions++;
        this.nodes[this.stack[this.stack.length - 1]].selfSamples++;

        if (kind === VesInstructionKind.CALL) {
            // JAL is two halfwords, so this is the instruction after it.
            this.pendingReturn = (address + 4) >>> 0;
        }
    }

    /**
     * Leave every frame that was waiting for this address.
     *
     * More than one at a time because a return can skip levels: a tail call
     * leaves its caller's frame to be closed by the callee's return, and a
     * non-local exit can abandon several at once. Scanning from the top down
     * finds the innermost frame that was expecting to come back here.
     */
    protected unwindTo(address: number): void {
        for (let depth = this.stack.length - 1; depth > 0; depth--) {
            if (this.returnTo[depth] === address) {
                this.stack.length = depth;
                this.returnTo.length = depth;
                return;
            }
        }
    }

    protected enter(address: number, returnTo: number): void {
        if (this.stack.length >= MAX_DEPTH) {
            this.overflowed++;
            return;
        }
        const parent = this.stack[this.stack.length - 1];
        let child = this.nodes[parent].children.get(address);
        if (child === undefined) {
            child = this.nodes.length;
            this.nodes.push({
                id: child, parent, address, selfSamples: 0, totalSamples: 0, children: new Map(),
            });
            this.nodes[parent].children.set(address, child);
        }
        this.stack.push(child);
        this.returnTo.push(returnTo);
    }

    /** Calls dropped for exceeding MAX_DEPTH, which nothing normal should. */
    get overflows(): number {
        return this.overflowed;
    }

    get sampleCount(): number {
        return this.instructions;
    }

    /**
     * How many times the machine restarted during the recording.
     *
     * Worth surfacing rather than hiding: a profile spanning several reboots
     * is describing several runs, and a reader should know that before drawing
     * conclusions from it.
     */
    get resetCount(): number {
        return this.resets;
    }

    /**
     * Roll self time up into total time.
     *
     * Children always come after their parent in `nodes` — a node is only
     * created while its parent is on the stack — so one pass backwards
     * accumulates the whole tree without recursing.
     */
    finish(): VesProfileNode[] {
        for (const node of this.nodes) {
            node.totalSamples = node.selfSamples;
        }
        for (let at = this.nodes.length - 1; at > 0; at--) {
            const node = this.nodes[at];
            this.nodes[node.parent].totalSamples += node.totalSamples;
        }
        return this.nodes;
    }
}

// --- Firefox Profiler -------------------------------------------------------

/** What a frame's address is called, and where it came from. */
export interface VesProfileSymbol {
    name: string;
    file?: string;
    line?: number;
}

/**
 * The processed profile shape Firefox Profiler reads.
 *
 * Deliberately loose: the format is a set of parallel arrays whose exact
 * membership shifts between versions, and this only has to produce one the
 * importer accepts. The invariants that matter — every index in range, every
 * table the length it claims — are what the tests check.
 */
export interface VesFirefoxProfile {
    meta: Record<string, unknown>;
    libs: unknown[];
    threads: Record<string, unknown>[];
}

/** The processed-format version this was written against. */
const PREPROCESSED_PROFILE_VERSION = 48;
const PROFILE_VERSION = 27;

/**
 * Convert a collected tree into a profile Firefox Profiler can open.
 *
 * Samples are *instructions*, not time, so the weight column says so: one
 * sample per instruction executed, which is exact rather than statistical.
 *
 * @param nodes the tree, after `finish()`
 * @param symbolise names an address — the Phase 5 line table does this
 * @param product what was profiled, shown as the profile's title. The game,
 *     not the editor: someone comparing two captures needs to know which is
 *     which, and every one of them would otherwise be called the same thing.
 */
export function toFirefoxProfile(
    nodes: VesProfileNode[],
    symbolise: (address: number) => VesProfileSymbol,
    product: string
): VesFirefoxProfile {
    const strings: string[] = [];
    const stringIndex = new Map<string, number>();
    const intern = (text: string): number => {
        let index = stringIndex.get(text);
        if (index === undefined) {
            index = strings.length;
            strings.push(text);
            stringIndex.set(text, index);
        }
        return index;
    };

    const funcName: number[] = [];
    const funcFile: (number | null)[] = [];
    const funcLine: (number | null)[] = [];
    const funcByAddress = new Map<number, number>();
    const funcFor = (address: number): number => {
        let index = funcByAddress.get(address);
        if (index === undefined) {
            const symbol = address < 0
                ? { name: '(root)' }
                : symbolise(address);
            index = funcName.length;
            funcName.push(intern(symbol.name));
            funcFile.push(symbol.file === undefined ? null : intern(symbol.file));
            funcLine.push(symbol.line ?? null);
            funcByAddress.set(address, index);
        }
        return index;
    };

    // One frame and one stack node per tree node, which is the simplest shape
    // that is still correct: the tree already has exactly the structure the
    // stack table wants, parents included.
    const frameFunc: number[] = [];
    const frameAddress: number[] = [];
    const frameLine: (number | null)[] = [];
    const stackFrame: number[] = [];
    const stackPrefix: (number | null)[] = [];

    for (const node of nodes) {
        const func = funcFor(node.address);
        frameFunc.push(func);
        frameAddress.push(node.address < 0 ? -1 : node.address);
        frameLine.push(funcLine[func]);
        stackFrame.push(node.id);
        stackPrefix.push(node.parent < 0 ? null : node.parent);
    }

    // A sample per node carrying that node's self time as its weight. The
    // format allows weighted samples, so an exhaustive count does not have to
    // be expanded into one entry per instruction — which for a minute of play
    // would be hundreds of millions of them.
    //
    // The time column is the running total of those weights, which makes the
    // axis *instructions executed*, not a clock. Two reasons it is not left at
    // zero: a profile whose samples all share one timestamp has a zero-length
    // range, which leaves the timeline with nothing to show; and the widths it
    // gives each frame are then truthful, since they are exactly the share of
    // execution that frame accounted for.
    //
    // What it is not is a chronology. Samples come out in tree order, so
    // reading the timeline left to right does not replay the session — the
    // call tree is what this format is being used for.
    const sampleStack: number[] = [];
    const sampleTime: number[] = [];
    const sampleWeight: number[] = [];
    let elapsed = 0;
    for (const node of nodes) {
        if (node.selfSamples === 0) {
            continue;
        }
        sampleStack.push(node.id);
        sampleTime.push(elapsed);
        sampleWeight.push(node.selfSamples);
        elapsed += node.selfSamples;
    }

    const category = new Array(nodes.length).fill(0);
    return {
        meta: {
            interval: 1,
            startTime: 0,
            processType: 0,
            product,
            stackwalk: 1,
            version: PROFILE_VERSION,
            preprocessedProfileVersion: PREPROCESSED_PROFILE_VERSION,
            symbolicated: true,
            markerSchema: [],
            // No `sampleUnits`. It describes the units of a `threadCPUDelta`
            // column, and declaring it with a null unit makes the importer
            // throw from `computeReferenceCPUDeltaPerMs`, which switches on
            // that value and has no case for "none". These samples carry no
            // CPU deltas at all — their weight is instructions — so the whole
            // field is left out rather than filled in with something empty.
            categories: [
                { name: 'Other', color: 'grey', subcategories: ['Other'] },
            ],
        },
        libs: [],
        threads: [{
            processType: 'default',
            processStartupTime: 0,
            processShutdownTime: null,
            registerTime: 0,
            unregisterTime: null,
            pausedRanges: [],
            name: 'Virtual Boy',
            isMainThread: true,
            pid: '1',
            tid: 1,
            samples: {
                stack: sampleStack,
                time: sampleTime,
                weight: sampleWeight,
                weightType: 'samples',
                length: sampleStack.length,
            },
            markers: { data: [], name: [], startTime: [], endTime: [], phase: [], category: [], length: 0 },
            stackTable: {
                frame: stackFrame,
                prefix: stackPrefix,
                category,
                subcategory: new Array(nodes.length).fill(0),
                length: nodes.length,
            },
            frameTable: {
                address: frameAddress,
                inlineDepth: new Array(nodes.length).fill(0),
                category,
                subcategory: new Array(nodes.length).fill(0),
                func: frameFunc,
                nativeSymbol: new Array(nodes.length).fill(null),
                innerWindowID: new Array(nodes.length).fill(null),
                implementation: new Array(nodes.length).fill(null),
                line: frameLine,
                column: new Array(nodes.length).fill(null),
                length: nodes.length,
            },
            funcTable: {
                isJS: new Array(funcName.length).fill(false),
                relevantForJS: new Array(funcName.length).fill(false),
                name: funcName,
                resource: new Array(funcName.length).fill(-1),
                fileName: funcFile,
                lineNumber: funcLine,
                columnNumber: new Array(funcName.length).fill(null),
                length: funcName.length,
            },
            resourceTable: { lib: [], name: [], host: [], type: [], length: 0 },
            nativeSymbols: { address: [], functionSize: [], libIndex: [], name: [], length: 0 },
            stringArray: strings,
        }],
    };
}
