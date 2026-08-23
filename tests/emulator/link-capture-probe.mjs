// Does the core's write callback see link port stores, and does a started
// transfer ever complete without a peer?
//
// Both questions decide whether rumble pack forwarding can work at all: the
// emulator takes the bytes a game broadcasts off the link port by watching
// writes to CDTR and CCR (see setLinkCapture in ves-vb-worker.ts), and a game
// that broadcasts stalls if the core never clears CCR's pending bit.
//
// Built on write-callback-probe.mjs, which established the callback ABI and
// the table patching needed to install one; the ROM here stores to the
// terminal port first, so a run that reports nothing at all can be told apart
// from one where the program never executed.
//
// Usage: node scripts/link-capture-probe.mjs
import fs from 'fs';

/** Link port registers, see libgccvb/source/hw.h. */
const CCR = 0x02000000;
const CDTR = 0x02000008;
/** __COM_START and __COM_PENDING, see Communications.c. */
const COM_START = 0x04;
const COM_PENDING = 0x02;
/** Proof-of-execution marker, on the path write-callback-probe already pinned down. */
const TERMINAL_PORT = 0x02000030;
const TERMINAL_BYTE = 0x41;
/** The byte the program broadcasts. */
const PAYLOAD = 0x55;
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
            if (count !== 1) {
                throw new Error(`Expected one table, found ${count}`);
            }
            at++; // reftype
            const flag = bytes[at];
            at++;
            const [, minLength] = readUleb(bytes, at);
            if (slots > 0x7f || minLength !== 1) {
                throw new Error('Table limits are not single-byte, cannot patch in place');
            }
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

// --- A V810 program that broadcasts one byte ---------------------------------

/**
 * The reset vector only has the last 16 bytes of the image to itself, which is
 * not enough for this program, so it jumps back to one laid out just below.
 *
 *   at 0xFFFFFFC0:
 *     movhi 0x0200, r0, r10    r10 = 0x02000000
 *     movea 0x0041, r0, r13
 *     st.b  r13, 0x30[r10]     terminal port: "the program ran"
 *     movea 0x0055, r0, r11
 *     st.b  r11, 0x08[r10]     CDTR = payload
 *     movea 0x0004, r0, r12
 *     st.b  r12, 0x00[r10]     CCR = __COM_START, as master
 *     br    0                  spin
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
    const movhi = (imm, reg) => { half((0x2f << 10) | (reg << 5) | 0); half(imm); };
    const movea = (imm, reg) => { half((0x28 << 10) | (reg << 5) | 0); half(imm); };
    const stb = (src, disp, base) => { half((0x34 << 10) | (src << 5) | base); half(disp); };

    movhi(0x0200, 10);
    movea(TERMINAL_BYTE, 13);
    stb(13, TERMINAL_PORT & 0xffff, 10);
    movea(PAYLOAD, 11);
    stb(11, CDTR & 0xffff, 10);
    movea(COM_START, 12);
    stb(12, CCR & 0xffff, 10);
    half(0x9400); // br 0

    // jr -0x30, at the reset vector.
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
    const byte = new Uint8Array(E.memory.buffer, valuePointer, 1)[0];
    if (writes.length < 256) {
        writes.push({ address: address >>> 0, byte, type });
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

function runFrame() {
    E.vbSetSamples(sim, E.GetExtSamples(sim), 5, 834);
    new Uint32Array(E.memory.buffer, clocksPtr, 1)[0] = 400000;
    let guard = 0;
    while (new Uint32Array(E.memory.buffer, clocksPtr, 1)[0] !== 0 && guard++ < 100000) {
        E.Emulate(simsPtr, 1, clocksPtr);
    }
}

runFrame();

console.log('Writes seen by the callback');
const byAddress = new Map();
for (const write of writes) {
    byAddress.set(write.address, write);
}
for (const [address, write] of [...byAddress].sort((a, b) => a[0] - b[0])) {
    console.log(`  0x${address.toString(16).padStart(8, '0')} = 0x${write.byte.toString(16).padStart(2, '0')} (type ${write.type})`);
}
console.log(`  ${writes.length} write(s) total\n`);

console.log('Checks');
check('the program ran (terminal port write seen)', byAddress.has(TERMINAL_PORT), true);
check('the payload store is seen', byAddress.get(CDTR)?.byte, PAYLOAD);
check('the transfer start is seen', byAddress.get(CCR)?.byte, COM_START);

// What ves-vb-worker.ts's capture rule would have produced from these writes.
const forwarded = [];
let transmit = 0;
for (const write of writes) {
    if (write.address === CDTR) {
        transmit = write.byte;
    } else if (write.address === CCR && (write.byte & COM_START) !== 0) {
        forwarded.push(transmit);
    }
}
check('capture rule forwards exactly one byte', forwarded.length, 1);
check('and it is the payload', forwarded[0], PAYLOAD);

// Does an unpeered transfer ever finish? A game polls CCR's pending bit and
// waits for it, so a bit that never clears is a game that never continues.
const pendingAfter = [];
for (let frame = 0; frame < 5; frame++) {
    pendingAfter.push(E.vbRead(sim, CCR, 0) & 0xff);
    runFrame();
}
console.log(`\nCCR read back over 5 frames: ${pendingAfter.map(v => '0x' + v.toString(16).padStart(2, '0')).join(' ')}`);
const stuck = pendingAfter.every(value => (value & COM_PENDING) !== 0);
console.log(stuck
    ? '  CCR pending never clears: a broadcasting game would wait for ever.'
    : '  CCR pending is not stuck.');

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
