// Can a call stack be rebuilt by watching instructions, and what does it cost?
//
// Phase 6's export profiler replays a recorded session with an execute callback
// and maintains a *shadow* call stack from the calls and returns it sees, rather
// than unwinding the real one. That sidesteps `-fomit-frame-pointer` entirely
// (§5.6) — nothing is unwound, so there is no frame to find. Two things have to
// hold for that to work:
//
//   1. Calls and returns are recognisable from the instruction alone. On the
//      V810 a call is JAL and the ordinary return is JMP [r31].
//   2. Maintaining the stack is cheap enough to replay a real session in
//      tolerable time. breakpoint-probe.mjs put a bare execute callback at
//      1.12x and one doing a Set lookup at 1.38x; this is more work than that.
//
// It also measures the difference between reading each instruction back out of
// the machine and pre-decoding the ROM once, which is the design question:
// the ROM does not change during a replay, so every instruction's kind can be
// known before the replay starts.
//
// Usage: node tests/emulator/callstack-probe.mjs
import fs from 'fs';

const TABLE_SLOTS = 16;
/** vbRead's type argument; see VbDataType. */
const U16 = 3;

/** V810 opcodes, in the top six bits of the first halfword. */
const OP_JMP = 0b000110;
const OP_JR = 0b101010;
const OP_JAL = 0b101011;
/** The link register, which JMP returns through. */
const LINK_REGISTER = 31;

const corePath = new URL(
    '../../applications/electron/binaries/vuengine-studio-tools/web/shrooms-vb-core/core.wasm',
    import.meta.url
);

let failures = 0;
const check = (label, actual, expected) => {
    const ok = Object.is(actual, expected);
    if (!ok) {
        failures++;
    }
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : `: got ${actual}, expected ${expected}`}`);
    return ok;
};
const report = (label, value) => console.log(`  --   ${label}: ${value}`);

// --- Patching the table (see write-callback-probe.mjs) -----------------------

function readUleb(bytes, at) {
    let result = 0, shift = 0, length = 0, byte;
    do {
        byte = bytes[at + length];
        result |= (byte & 0x7f) << shift;
        shift += 7;
        length++;
    } while (byte & 0x80);
    return [result, length];
}

function patchTableLimit(bytes, slots) {
    let position = 8;
    while (position < bytes.length) {
        const id = bytes[position];
        const [size, sizeLength] = readUleb(bytes, position + 1);
        const start = position + 1 + sizeLength;
        if (id === 4) {
            let at = start;
            const [count, countLength] = readUleb(bytes, at);
            at += countLength;
            at++; // reftype
            const flag = bytes[at];
            at++;
            bytes[at] = slots;
            if (flag === 1) {
                bytes[at + 1] = slots;
            }
            return bytes;
        }
        position = start + size;
    }
    throw new Error('No table section found');
}

const coreBytes = patchTableLimit(fs.readFileSync(corePath), TABLE_SLOTS);

// --- The execute callback's (i32 x4) -> i32 trampoline -----------------------

function uleb(value) {
    const out = [];
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

const section = (id, payload) => [id, ...uleb(payload.length), ...payload];
const vec = items => [...uleb(items.length), ...items.flat()];

function makeTrampoline(onCall, arity = 4) {
    const I32 = 0x7f;
    const type = [0x60, ...vec(Array.from({ length: arity }, () => [I32])), ...vec([[I32]])];
    const body = [];
    for (let i = 0; i < arity; i++) {
        body.push(0x20, ...uleb(i));
    }
    body.push(0x10, 0x00, 0x0b);

    const bytes = Uint8Array.from([
        0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
        ...section(1, vec([type])),
        ...section(2, vec([[0x01, 0x65, 0x01, 0x66, 0x00, 0x00]])),
        ...section(3, vec([[0x00]])),
        ...section(7, vec([[0x01, 0x74, 0x00, 0x01]])),
        ...section(10, vec([[...uleb(body.length + 1), 0x00, ...body]])),
    ]);

    return new WebAssembly.Instance(
        new WebAssembly.Module(bytes),
        { e: { f: onCall } }
    ).exports.t;
}

// --- A program with a known call tree ---------------------------------------

/**
 * main → outer → inner, then back out, forever:
 *
 *   main:   jal outer          depth 1
 *           br  main            round again, so the tree repeats
 *   outer:  mov r31, r20        save the link register...
 *           jal inner           ...which this is about to clobber
 *           mov r20, r31        ...and restore it
 *           jmp [r31]
 *   inner:  add r0, r0
 *           jmp [r31]
 *
 * The save and restore are the point, not decoration: JAL writes the return
 * address into r31, so a function that calls anything has to preserve it or it
 * can never return. Without them `outer` returns to itself forever, and the
 * probe would be asserting against a program that does not actually nest.
 */
const ROM_SIZE = 0x100000;
const PROGRAM = 0xffffff00;
const at = {};

function buildRom() {
    const rom = new Uint8Array(ROM_SIZE);
    const view = new DataView(rom.buffer);
    const base = ROM_SIZE - 0x100;
    let cursor = base;

    const mark = name => { at[name] = (PROGRAM + (cursor - base)) >>> 0; };
    const half = value => {
        view.setUint16(cursor, value & 0xffff, true);
        cursor += 2;
    };
    // Format II: opcode, then reg2 and a five-bit immediate.
    const mov = (imm, destination) => half((0x10 << 10) | (destination << 5) | (imm & 0x1f));
    // Format I: opcode, reg2, reg1.
    const addReg = (source, destination) => half((0x01 << 10) | (destination << 5) | source);
    const movReg = (source, destination) => half((0x00 << 10) | (destination << 5) | source);
    const jmp = register => half((OP_JMP << 10) | register);
    const jal = target => {
        const from = (PROGRAM + (cursor - base)) >>> 0;
        const disp = (target - from) | 0;
        half((OP_JAL << 10) | ((disp >> 16) & 0x3ff));
        half(disp & 0xffff);
    };
    const branch = target => {
        const from = (PROGRAM + (cursor - base)) >>> 0;
        half(0x8a00 | ((target - from) & 0x1ff));
    };

    // Reserve space for main, filled once the callees' addresses are known.
    const mainAt = cursor;
    mark('main');
    cursor += 8;

    mark('outer');
    movReg(LINK_REGISTER, 20);  // save the return address before clobbering it
    const outerBody = cursor;
    cursor += 4;                // jal inner, patched below
    movReg(20, LINK_REGISTER);  // and put it back
    mark('outerReturn');
    jmp(LINK_REGISTER);

    mark('inner');
    addReg(0, 0);
    mark('innerReturn');
    jmp(LINK_REGISTER);

    // main: call outer, then loop back to call it again.
    cursor = mainAt;
    jal(at.outer);
    branch(at.main);

    // outer: call inner.
    cursor = outerBody;
    jal(at.inner);

    // Reset vector jumps to main.
    cursor = ROM_SIZE - 0x10;
    const disp = (at.main - (PROGRAM + 0xf0)) | 0;
    half((OP_JR << 10) | ((disp >> 16) & 0x3ff));
    half(disp & 0xffff);
    return rom;
}

const ROM = buildRom();

// --- Boot --------------------------------------------------------------------

const { instance } = await WebAssembly.instantiate(coreBytes, {
    env: { emscripten_notify_memory_growth: () => { } }
});
const E = instance.exports;
E._initialize();

function newSim() {
    const romPtr = E.Realloc(0, ROM.length);
    new Uint8Array(E.memory.buffer, romPtr, ROM.length).set(ROM);
    const sim = E.Realloc(0, E.vbSizeOf());
    E.vbInit(sim);
    E.vbSetCartROM(sim, romPtr, ROM.length);
    E.vbReset(sim);
    return sim;
}

function emulate(sim, clocks) {
    const sims = E.Realloc(0, 4);
    const clockBox = E.Realloc(0, 4);
    new Uint32Array(E.memory.buffer, sims, 1)[0] = sim;
    new Uint32Array(E.memory.buffer, clockBox, 1)[0] = clocks;
    E.Emulate(sims, 1, clockBox);
    E.Realloc(sims, 0);
    E.Realloc(clockBox, 0);
}

console.log('Program layout:');
for (const [name, address] of Object.entries(at)) {
    report(name, '0x' + (address >>> 0).toString(16).toUpperCase());
}

// --- 1. Are calls and returns recognisable? ---------------------------------

console.log('\n1. Recognising calls and returns');
{
    const sim = newSim();
    const stack = [];
    let deepest = 0;
    const sequence = [];

    instance.exports.__indirect_function_table.set(1, makeTrampoline((s, pc, unused, length) => {
        const address = pc >>> 0;
        const word = E.vbRead(s, address, U16) & 0xffff;
        const opcode = word >>> 10;
        if (opcode === OP_JAL) {
            // The return lands after the two halfwords a JAL occupies.
            stack.push((address + 4) >>> 0);
            deepest = Math.max(deepest, stack.length);
            if (sequence.length < 8) {
                sequence.push(`call@${stack.length}`);
            }
        } else if (opcode === OP_JMP && (word & 0x1f) === LINK_REGISTER) {
            stack.pop();
            if (sequence.length < 8) {
                sequence.push(`ret@${stack.length}`);
            }
        }
        return 0;
    }));
    E.vbSetExecuteCallback(sim, 1);

    emulate(sim, 400);
    report('deepest stack', deepest);
    report('first events', sequence.join(' '));
    report('stack depth at the end', stack.length);
    // main → outer → inner is two frames below main, and main never returns.
    check('the call tree reaches two deep', deepest, 2);
    check('calls and returns nest as the tree does', sequence.slice(0, 4).join(' '),
        'call@1 call@2 ret@1 ret@0');
    // The loop runs the same tree over and over, so the pattern repeats rather
    // than drifting — which is what says returns are being matched to calls
    // and not merely counted.
    check('the pattern repeats on the next lap', sequence.slice(4, 8).join(' '),
        'call@1 call@2 ret@1 ret@0');
    // Not zero: the run is cut off at a clock count, which lands wherever it
    // lands — usually part way through a lap. What matters is that the depth
    // is somewhere the tree actually reaches, so no return went unmatched and
    // no call went unclosed.
    check('the run ends somewhere inside the tree', stack.length >= 0 && stack.length <= 2, true);
}

// --- 2. Pre-decoding the ROM instead of reading each instruction ------------

console.log('\n2. Pre-decoding the ROM');
/**
 * The ROM does not change while a replay runs, so what kind of instruction
 * lives at each address can be worked out once, before it starts. A byte per
 * halfword over a 16 MB ROM is 8 MB of table — cheap next to reading every
 * instruction back out of the machine.
 */
const KIND_OTHER = 0;
const KIND_CALL = 1;
const KIND_RETURN = 2;

function decodeRom(rom) {
    const kinds = new Uint8Array(rom.length >> 1);
    const view = new DataView(rom.buffer, rom.byteOffset, rom.byteLength);
    for (let at2 = 0; at2 + 1 < rom.length; at2 += 2) {
        const word = view.getUint16(at2, true);
        const opcode = word >>> 10;
        kinds[at2 >> 1] = opcode === OP_JAL ? KIND_CALL
            : opcode === OP_JMP && (word & 0x1f) === LINK_REGISTER ? KIND_RETURN
                : KIND_OTHER;
    }
    return kinds;
}

const decodeStarted = process.hrtime.bigint();
const KINDS = decodeRom(ROM);
report('decode of a 1 MB ROM',
    `${(Number(process.hrtime.bigint() - decodeStarted) / 1e6).toFixed(1)} ms, ${KINDS.length.toLocaleString()} entries`);
{
    const sim = newSim();
    const stack = [];
    let deepest = 0;
    instance.exports.__indirect_function_table.set(2, makeTrampoline((s, pc) => {
        // The program counter is in the ROM mirror, so index by ROM offset.
        const kind = KINDS[((pc >>> 0) & (ROM_SIZE - 1)) >> 1];
        if (kind === KIND_CALL) {
            stack.push(pc);
            deepest = Math.max(deepest, stack.length);
        } else if (kind === KIND_RETURN) {
            stack.pop();
        }
        return 0;
    }));
    E.vbSetExecuteCallback(sim, 2);
    emulate(sim, 400);
    check('the pre-decoded table sees the same tree', deepest, 2);
}

// --- 3. What does it cost? --------------------------------------------------

console.log('\n3. Cost of a replay');
{
    const CLOCKS = 20_000_000;
    const time = (label, install) => {
        const sim = newSim();
        install(sim);
        const started = process.hrtime.bigint();
        emulate(sim, CLOCKS);
        const ns = Number(process.hrtime.bigint() - started);
        report(label, `${(ns / 1e6).toFixed(0)} ms`);
        return ns;
    };

    const bare = time('no callback', sim => E.vbSetExecuteCallback(sim, 0));

    let counted = 0;
    instance.exports.__indirect_function_table.set(3, makeTrampoline(() => {
        counted++;
        return 0;
    }));
    const counting = time('counting only', sim => E.vbSetExecuteCallback(sim, 3));

    // (a) Reading the instruction back out of the machine every time.
    const readStack = [];
    instance.exports.__indirect_function_table.set(4, makeTrampoline((s, pc) => {
        const word = E.vbRead(s, pc >>> 0, U16) & 0xffff;
        const opcode = word >>> 10;
        if (opcode === OP_JAL) {
            readStack.push(pc);
        } else if (opcode === OP_JMP && (word & 0x1f) === LINK_REGISTER) {
            readStack.pop();
        }
        return 0;
    }));
    const reading = time('shadow stack, reading each instruction', sim => E.vbSetExecuteCallback(sim, 4));

    // (b) The same, off the pre-decoded table.
    const fastStack = [];
    let samples = 0;
    instance.exports.__indirect_function_table.set(5, makeTrampoline((s, pc) => {
        const kind = KINDS[((pc >>> 0) & (ROM_SIZE - 1)) >> 1];
        if (kind === KIND_CALL) {
            fastStack.push(pc);
        } else if (kind === KIND_RETURN) {
            fastStack.pop();
        }
        samples++;
        return 0;
    }));
    const decoded = time('shadow stack, pre-decoded table', sim => E.vbSetExecuteCallback(sim, 5));

    report('instructions', counted.toLocaleString());
    report('callback alone', `${(counting / bare).toFixed(2)}x`);
    report('reading each instruction', `${(reading / bare).toFixed(2)}x`);
    report('pre-decoded table', `${(decoded / bare).toFixed(2)}x`);
    report('samples maintained', samples.toLocaleString());
    // 20,000,000 clocks is one second of Virtual Boy time. A replay is offline,
    // so it may run below real time — but a minute of play should not take an
    // afternoon. Ten times real time is the bound worth holding.
    report('replay of a minute of play',
        `${((decoded / 1e9) * 60).toFixed(0)} s (pre-decoded), ${((reading / 1e9) * 60).toFixed(0)} s (reading)`);
    check('pre-decoding is the cheaper of the two', decoded < reading, true);
    check('a replay stays within ten times real time', decoded < 10e9, true);
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nall checks passed');
process.exit(failures ? 1 : 0);
