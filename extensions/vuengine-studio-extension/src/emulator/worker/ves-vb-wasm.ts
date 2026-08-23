/**
 * Typed view of the Shrooms-VB core's WebAssembly exports.
 *
 * The `vb*` functions are the core's public C API. The capitalised ones are the
 * web build's helpers, which wrap allocation, the anaglyph mixer and the
 * multi-simulation emulation entry point.
 *
 * The module has exactly one import (`emscripten_notify_memory_growth`) and is
 * otherwise self-contained.
 */
export interface VesVbWasmExports {
    memory: WebAssembly.Memory;
    // Indirect call targets. Callback "pointers" are indices into this.
    __indirect_function_table: WebAssembly.Table;

    // Reactor-style entry point, must be called before anything else.
    _initialize(): void;

    // --- Allocation ---------------------------------------------------------

    // malloc/realloc/free in one. A size of 0 frees, a pointer of 0 allocates.
    Realloc(pointer: number, size: number): number;
    // Width of a pointer in bytes, for indexing pointer arrays.
    PointerSize(): number;
    // Byte size of a simulation's state struct.
    vbSizeOf(): number;

    // --- Simulation lifecycle -----------------------------------------------

    // Allocate and initialise a simulation, returning its pointer.
    CreateSim(): number;
    // Return a simulation to its power-on state.
    vbReset(sim: number): void;

    // --- Cartridge ----------------------------------------------------------

    vbGetCartROM(sim: number): number;
    // Returns 0 on success. Size must be a power of two.
    vbSetCartROM(sim: number, pointer: number, size: number): number;
    vbGetCartRAM(sim: number): number;
    // Returns 0 on success. Size must be a power of two.
    vbSetCartRAM(sim: number, pointer: number, size: number): number;

    // --- Emulation ----------------------------------------------------------

    /**
     * Emulate an array of simulations. `clocks` points at a uint32 holding the
     * number of clocks left to run, which is decremented in place; emulation
     * returns early on a break condition, so callers loop until it reaches 0.
     */
    Emulate(sims: number, count: number, clocks: number): void;
    // Break conditions raised since the last call, see VbBreak.
    GetBreaks(sim: number): number;

    // --- Video --------------------------------------------------------------

    // Refresh the simulation's RGBA framebuffer from its current VIP state.
    GetPixels(sim: number): void;
    // Pointer to the simulation's RGBA framebuffer (384 * 224 * 4 bytes).
    GetExtPixels(sim: number): number;
    // Configure the per-eye colours used when compositing the framebuffer.
    SetAnaglyph(sim: number, left: number, right: number): void;

    // --- Audio --------------------------------------------------------------

    // Pointer to the simulation's sample buffer.
    GetExtSamples(sim: number): number;
    // Point a simulation at a sample buffer and reset its write position.
    vbSetSamples(sim: number, pointer: number, type: number, count: number): void;
    // Mix every simulation's samples into one interleaved stereo buffer.
    Mix(destination: number, sims: number, count: number): void;
    SetVolume(sim: number, volume: number): void;
    SetPanning(sim: number, panning: number): void;

    // --- Input --------------------------------------------------------------

    vbSetKeys(sim: number, keys: number): void;
    vbGetKeys(sim: number): number;

    // --- Linking (Phase 3) --------------------------------------------------

    vbGetPeer(sim: number): number;
    vbSetPeer(sim: number, peer: number): void;

    // --- Memory and debug access (Phase 4) ----------------------------------

    vbRead(sim: number, address: number, type: number): number;
    vbWrite(sim: number, address: number, type: number, value: number): void;
    vbGetProgramCounter(sim: number): number;
    vbSetProgramCounter(sim: number, address: number): void;
    vbGetProgramRegister(sim: number, index: number): number;
    vbSetProgramRegister(sim: number, index: number, value: number): void;
    vbGetSystemRegister(sim: number, index: number): number;
    vbSetSystemRegister(sim: number, index: number, value: number): void;
    vbGetOption(sim: number, key: number): number;
    vbSetOption(sim: number, key: number, value: number): void;

    /**
     * Install a callback invoked on every CPU write, or 0 to remove it.
     *
     * The argument is an index into `__indirect_function_table`, not an address.
     * See VES_VB_WRITE_CALLBACK_TYPE for the signature the target must have.
     */
    vbSetWriteCallback(sim: number, callback: number): void;
    vbGetWriteCallback(sim: number): number;

    /**
     * Install a callback invoked before every instruction, or 0 to remove it.
     *
     * Takes four arguments, not the write callback's six — see
     * VES_VB_EXECUTE_CALLBACK_ARITY. The second is the program counter, and
     * returning non-zero halts `Emulate` *before* that instruction runs,
     * leaving the program counter on it. `GetBreaks` does not report a stop
     * raised this way; the callback's return is the only signal there is.
     */
    vbSetExecuteCallback(sim: number, callback: number): void;
    vbGetExecuteCallback(sim: number): number;

    // --- Disassembler -------------------------------------------------------

    /**
     * Disassemble `count` instructions from an address, returning a block of
     * C strings, or 0 on a memory error. The caller frees it with Realloc.
     */
    vbuDisassemble(sim: number, address: number, unused: number, count: number, line: number): number;
    /**
     * Fill `destination` with 17 words per line describing the block returned
     * by vbuDisassemble: address, code length, up to four code words, a
     * program counter flag, and offsets of the strings within the block.
     */
    GetDasm(destination: number, dasm: number, count: number): void;
}

/**
 * Slots the function table is widened to.
 *
 * The core ships with five, all spoken for, so every callback we install needs
 * one of the spares. Eight is more than the callback kinds the core exposes.
 */
export const VES_VB_TABLE_SLOTS = 16;

/**
 * Raise the declared limits of the core's function table.
 *
 * The core was built without table growth, so its table is pinned at exactly
 * the five entries it ships with and `grow` fails — there is nowhere to install
 * a callback. Both limits encode as a single LEB128 byte and element segments
 * use fixed offsets, so raising them is an in-place byte patch that leaves
 * every other offset in the module alone.
 *
 * Verified by `scripts/write-callback-probe.mjs`, which asserts the core's own
 * four entries and its default frame callback survive the patch.
 */
export function patchVesVbTableLimit(bytes: Uint8Array, slots = VES_VB_TABLE_SLOTS): Uint8Array {
    const readUleb = (at: number): [number, number] => {
        let result = 0;
        let shift = 0;
        let length = 0;
        let byte = 0;
        do {
            byte = bytes[at + length];
            result |= (byte & 0x7f) << shift;
            shift += 7;
            length++;
        } while (byte & 0x80);
        return [result, length];
    };

    let position = 8;   // past the magic and version
    while (position < bytes.length) {
        const id = bytes[position];
        const [size, sizeLength] = readUleb(position + 1);
        const start = position + 1 + sizeLength;

        if (id === 4) {   // table section
            let at = start;
            const [count, countLength] = readUleb(at);
            at += countLength;
            if (count !== 1) {
                throw new Error(`Emulator core declares ${count} tables, expected exactly one.`);
            }
            at++;   // reftype
            const hasMaximum = bytes[at] === 1;
            at++;
            const [, minimumLength] = readUleb(at);
            if (slots > 0x7f || minimumLength !== 1) {
                throw new Error('Emulator core table limits cannot be widened in place.');
            }
            bytes[at] = slots;
            if (hasMaximum) {
                bytes[at + 1] = slots;
            }
            return bytes;
        }
        position = start + size;
    }
    throw new Error('Emulator core has no table section.');
}

/**
 * A callback the core can invoke.
 *
 * For writes the arguments are the simulation pointer, the address, the data
 * type, a pointer to the value being written, and two further out-parameters
 * the core leaves at zero. Returning 0 lets the access proceed normally.
 */
/**
 * How many arguments each kind of callback takes.
 *
 * There is no single signature: writes take six and execute takes four. A
 * trampoline of the wrong shape is not a type error anywhere — the core simply
 * throws `null function or function signature mismatch` the first time it
 * calls it. Measured, not assumed: see `tests/emulator/breakpoint-probe.mjs`.
 */
export const VES_VB_WRITE_CALLBACK_ARITY = 6;
export const VES_VB_EXECUTE_CALLBACK_ARITY = 4;

export type VesVbCallback = (
    sim: number,
    address: number,
    type: number,
    valuePointer: number,
    outA: number,
    outB: number
) => number;

function uleb(value: number): number[] {
    const out: number[] = [];
    do {
        let byte = value & 0x7f;
        value >>>= 7;
        if (value !== 0) {
            byte |= 0x80;
        }
        out.push(byte);
    } while (value !== 0);
    return out;
}

/**
 * Build a wasm function of the core's callback signature that forwards to a
 * JS function.
 *
 * The arity is deliberately a required argument rather than a default. It used
 * to default to the write callback's six, written as the exported constant —
 * which compiled to `exports.VES_VB_WRITE_CALLBACK_ARITY` and was then
 * captured by this module's own parameter named `exports`, yielding
 * `undefined`, a zero-argument trampoline, and `function signature mismatch`
 * the first time the core called it. Making every caller say which signature
 * it wants removes the trap along with the default.
 *
 * A JS function cannot go into the table directly: the core is a pure wasm
 * module with no Emscripten glue, and `WebAssembly.Function` — which would wrap
 * one — is not available in the browsers this ships to. A one-function module
 * that imports the JS callback and exports it under the right wasm type is the
 * portable way to bridge that gap.
 */
function makeCallbackTrampoline(callback: VesVbCallback, arity: number): Function {
    if (!Number.isInteger(arity) || arity < 1) {
        throw new Error(`A callback trampoline needs a real argument count, not ${arity}.`);
    }
    const I32 = 0x7f;
    const section = (id: number, payload: number[]): number[] => [id, ...uleb(payload.length), ...payload];
    const vector = (items: number[][]): number[] => [...uleb(items.length), ...items.flat()];

    const type = [
        0x60,
        ...vector(Array.from({ length: arity }, () => [I32])),
        ...vector([[I32]]),
    ];

    const body: number[] = [];
    for (let index = 0; index < arity; index++) {
        body.push(0x20, ...uleb(index));   // local.get
    }
    body.push(0x10, 0x00);                 // call the import
    body.push(0x0b);                       // end

    const bytes = Uint8Array.from([
        0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
        ...section(1, vector([type])),
        // import "e"."f", the JS callback
        ...section(2, vector([[0x01, 0x65, 0x01, 0x66, 0x00, 0x00]])),
        ...section(3, vector([[0x00]])),
        // export "t", the wasm function that forwards to it
        ...section(7, vector([[0x01, 0x74, 0x00, 0x01]])),
        ...section(10, vector([[...uleb(body.length + 1), 0x00, ...body]])),
    ]);

    const instance = new WebAssembly.Instance(new WebAssembly.Module(bytes), { e: { f: callback } });
    return instance.exports.t as Function;
}

/**
 * Put a JS callback in the core's function table and return its index, which is
 * what the core's `vbSet*Callback` functions take as a pointer.
 *
 * Index 0 is the null function pointer and means "no callback" to the core, so
 * it is never handed out.
 */
export function installVesVbCallback(
    exports: VesVbWasmExports,
    callback: VesVbCallback,
    arity: number
): number {
    const table = exports.__indirect_function_table;
    for (let index = 1; index < table.length; index++) {
        if (table.get(index) === null) {
            table.set(index, makeCallbackTrampoline(callback, arity));
            return index;
        }
    }
    throw new Error('Emulator core has no free callback slot.');
}

// Release a slot taken by installVesVbCallback.
export function releaseVesVbCallback(exports: VesVbWasmExports, index: number): void {
    if (index > 0 && index < exports.__indirect_function_table.length) {
        exports.__indirect_function_table.set(index, null);
    }
}

/**
 * Instantiate the core.
 *
 * The module is always fetched to an ArrayBuffer rather than instantiated from
 * the stream, because its function table has to be widened before compilation
 * for any callback to be installable.
 */
export async function instantiateVesVbWasm(wasmUrl: string): Promise<VesVbWasmExports> {
    const imports: WebAssembly.Imports = {
        env: {
            // The core grows its own memory; every typed array view we hand out
            // is created on demand, so there is nothing to invalidate here.
            emscripten_notify_memory_growth: () => { /* no-op */ },
        },
    };

    const response = await fetch(wasmUrl);
    if (!response.ok) {
        throw new Error(`Could not load emulator core from ${wasmUrl}: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    patchVesVbTableLimit(new Uint8Array(buffer));
    const { instance } = await WebAssembly.instantiate(buffer, imports);

    const exports = instance.exports as unknown as VesVbWasmExports;
    exports._initialize();

    if (exports.PointerSize() !== 4) {
        throw new Error('Emulator core was built with a pointer size other than 32 bits.');
    }

    return exports;
}
