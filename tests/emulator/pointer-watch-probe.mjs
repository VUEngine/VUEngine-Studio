// Does the write callback report a 32-bit store, and is the whole value
// readable at the pointer it hands over?
//
// write-callback-probe.mjs pinned the ABI using a byte store to a hardware
// register. Following a pointer variable — which is how the emulator works out
// which RumbleEffectSpec a game just started, see setPointerWatch — needs two
// more things from that same callback: that it fires for ordinary WRAM as well
// as for hardware registers, and that a word store reports all four bytes
// rather than just the low one.
//
// Usage: node scripts/pointer-watch-probe.mjs
import fs from 'fs';

/** Where the program stores, in WRAM, and what it stores there. */
const TARGET = 0x05000010;
const POINTER = 0x07001234;
/** Proof-of-execution marker, on the path write-callback-probe already pinned down. */
const TERMINAL_PORT = 0x02000030;
const TERMINAL_BYTE = 0x41;
const TABLE_SLOTS = 16;

const corePath = new URL(
    '../applications/electron/binaries/vuengine-studio-tools/web/shrooms-vb-core/core.wasm',
    import.meta.url
);

let failures = 0;

function check(label, actual, expected) {
    if (!Object.is(actual, expected)) {
        failures++;
        console.log(`  FAIL ${label}: got ${actual}, expected ${expected}`);
        return false;
    }
    console.log(`  ok   ${label}`);
    return true;
}

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

// --- The (i32 x6) -> i32 trampoline -----------------------------------------

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

function makeTrampoline(onCall) {
    const I32 = 0x7f;
    const type = [0x60, ...vec(Array.from({ length: 6 }, () => [I32])), ...vec([[I32]])];
    const body = [];
    for (let i = 0; i < 6; i++) {
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

// --- A V810 program that stores a pointer-sized value to WRAM ----------------

/**
 *   at 0xFFFFFFC0:
 *     movhi 0x0200, r0, r10      r10 = 0x02000000
 *     movea 0x0041, r0, r13
 *     st.b  r13, 0x30[r10]       terminal port: "the program ran"
 *     movhi 0x0700, r0, r11
 *     movea 0x1234, r11, r11     r11 = 0x07001234, a plausible ROM pointer
 *     movhi 0x0500, r0, r12      r12 = 0x05000000, WRAM
 *     st.w  r11, 0x0010[r12]     the store being watched
 *     br    0
 *   at 0xFFFFFFF0 (reset):
 *     jr    -0x30
 */
function buildRom() {
    const size = 0x100000;
    const rom = new Uint8Array(size);
    const view = new DataView(rom.buffer);
    let at = size - 0x40;
    const half = value => {
        view.setUint16(at, value & 0xffff, true);
        at += 2;
    };
    const movhi = (imm, source, destination) => { half((0x2f << 10) | (destination << 5) | source); half(imm); };
    const movea = (imm, source, destination) => { half((0x28 << 10) | (destination << 5) | source); half(imm); };
    const stb = (source, disp, base) => { half((0x34 << 10) | (source << 5) | base); half(disp); };
    const stw = (source, disp, base) => { half((0x37 << 10) | (source << 5) | base); half(disp); };

    movhi(0x0200, 0, 10);
    movea(TERMINAL_BYTE, 0, 13);
    stb(13, TERMINAL_PORT & 0xffff, 10);
    movhi(POINTER >>> 16, 0, 11);
    movea(POINTER & 0xffff, 11, 11);
    movhi(TARGET >>> 16, 0, 12);
    stw(11, TARGET & 0xffff, 12);
    half(0x9400); // br 0

    at = size - 0x10;
    const disp = -0x30;
    half((0x2a << 10) | ((disp >> 16) & 0x3ff));
    half(disp & 0xffff);
    return rom;
}

const ROM = buildRom();

// --- Run ---------------------------------------------------------------------

const { instance } = await WebAssembly.instantiate(coreBytes, {
    env: { emscripten_notify_memory_growth: () => { } }
});
const E = instance.exports;
E._initialize();

const romPtr = E.Realloc(0, ROM.length);
new Uint8Array(E.memory.buffer, romPtr, ROM.length).set(ROM);
const sim = E.CreateSim();
if (E.vbSetCartROM(sim, romPtr, ROM.length) !== 0) {
    throw new Error('Core rejected the synthetic ROM');
}
const ramPtr = E.Realloc(0, 8192);
new Uint8Array(E.memory.buffer, ramPtr, 8192).fill(0);
E.vbSetCartRAM(sim, ramPtr, 8192);

const writes = [];
const trampoline = makeTrampoline((simPointer, address, type, valuePointer) => {
    const view = new DataView(E.memory.buffer);
    if (writes.length < 64) {
        writes.push({
            address: address >>> 0,
            type,
            byte: view.getUint8(valuePointer),
            half: view.getUint16(valuePointer, true),
            word: view.getUint32(valuePointer, true),
        });
    }
    return 0;
});

const table = E.__indirect_function_table;
let slot = -1;
for (let index = 1; index < table.length; index++) {
    if (table.get(index) === null) {
        slot = index;
        break;
    }
}
table.set(slot, trampoline);
E.vbSetWriteCallback(sim, slot);
E.vbReset(sim);

const simsPtr = E.Realloc(0, 4);
new Uint32Array(E.memory.buffer, simsPtr, 1)[0] = sim;
const clocksPtr = E.Realloc(0, 4);
E.vbSetSamples(sim, E.GetExtSamples(sim), 5, 834);
new Uint32Array(E.memory.buffer, clocksPtr, 1)[0] = 400000;
let guard = 0;
while (new Uint32Array(E.memory.buffer, clocksPtr, 1)[0] !== 0 && guard++ < 100000) {
    E.Emulate(simsPtr, 1, clocksPtr);
}

console.log('Writes seen by the callback');
for (const write of writes) {
    console.log(`  0x${write.address.toString(16).padStart(8, '0')} type ${write.type}` +
        ` byte 0x${write.byte.toString(16)} half 0x${write.half.toString(16)} word 0x${write.word.toString(16)}`);
}

console.log('\nChecks');
const terminal = writes.find(write => write.address === TERMINAL_PORT);
check('the program ran (terminal port write seen)', terminal !== undefined, true);

const stored = writes.find(write => write.address === TARGET);
check('a WRAM write is reported at all', stored !== undefined, true);
if (stored) {
    check('the whole 32-bit value is readable', stored.word >>> 0, POINTER);
    console.log(`  note: a word store reports data type ${stored.type}` +
        ` (byte stores report ${terminal ? terminal.type : '?'})`);
    check('one word store produces one call', writes.filter(w => w.address === TARGET).length, 1);
}

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
