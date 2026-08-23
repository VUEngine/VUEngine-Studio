// Establishes and pins down the ABI of the Shrooms-VB core's write callback,
// which is what terminal output is built on.
//
// Three things had to be discovered empirically, because the vendored core
// ships no documentation and its own shim never uses callbacks:
//
//   1. Callbacks are indices into the exported __indirect_function_table, not
//      addresses. vbGetFrameCallback returns 2 out of the box, which is the
//      core's own default frame handler sitting in slot 2.
//
//   2. The core was built without table growth, so the table is pinned at the
//      five entries it ships with and there is nowhere to install anything.
//      Both of its declared limits encode as a single LEB128 byte, and element
//      segments use fixed offsets, so raising them is an in-place byte patch.
//
//   3. The callback signature is (i32 x6) -> i32. Every other arity traps with
//      a signature mismatch, which is what makes the sweep below conclusive.
//
// A JS function cannot be placed in the table directly, since the core is a
// pure wasm module and WebAssembly.Function is unavailable, so a tiny wasm
// trampoline module is assembled here that imports the JS function and exports
// a real wasm function of the right type.
//
// The write is produced by a hand-assembled V810 program storing a byte to the
// engine's terminal port, so this exercises the same path a game would.
//
// Usage: node scripts/write-callback-probe.mjs
import fs from 'fs';

/** The address VUEngine's Terminal::print writes to, see Terminal.c. */
const TERMINAL_PORT = 0x02000030;
/** The byte that program stores, chosen so it is recognisable in the output. */
const TERMINAL_BYTE = 0x41;
/** How many slots the table is widened to. */
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
    return true;
}

// --- Patching the table -----------------------------------------------------

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

// --- Assembling the trampoline ----------------------------------------------

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

function makeTrampoline(arity, returnsValue, onCall) {
    const I32 = 0x7f;
    const type = [
        0x60,
        ...vec(Array.from({ length: arity }, () => [I32])),
        ...vec(returnsValue ? [[I32]] : []),
    ];

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

// --- A V810 program that writes to the terminal port -------------------------

/**
 * A 1 MB cartridge whose reset vector stores one byte to the terminal port and
 * then spins. The V810 resets to 0xFFFFFFF0, which decodes to the cartridge
 * region and so lands at the very end of the image.
 *
 *   movhi 0x0200, r0, r10    r10 = 0x02000000
 *   movea 0x0041, r0, r11    r11 = 'A'
 *   st.b  r11, 0x30[r10]     [0x02000030] = 'A'
 *   br    0                  spin
 */
function buildRom() {
    const size = 0x100000;
    const rom = new Uint8Array(size);
    const view = new DataView(rom.buffer);
    let at = size - 0x10;
    const half = value => {
        view.setUint16(at, value & 0xffff, true);
        at += 2;
    };

    half((0x2f << 10) | (10 << 5) | 0); half(0x0200);
    half((0x28 << 10) | (11 << 5) | 0); half(TERMINAL_BYTE);
    half((0x34 << 10) | (11 << 5) | 10); half(0x0030);
    half(0x9400);
    return rom;
}

const ROM = buildRom();

// --- Running one candidate ---------------------------------------------------

async function run(arity, returnsValue) {
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

    const calls = [];
    const trampoline = makeTrampoline(arity, returnsValue, (...args) => {
        if (calls.length < 64) {
            const memory = new DataView(E.memory.buffer);
            calls.push({
                args,
                deref: args.map(argument => {
                    const address = argument >>> 0;
                    return address > 0x1000 && address + 4 <= E.memory.buffer.byteLength
                        ? memory.getInt32(address, true)
                        : undefined;
                }),
            });
        }
        return 0;
    });

    // Index 0 is the null function pointer and means "no callback", so the
    // first usable slot is the first null one above it.
    const table = E.__indirect_function_table;
    let slot = -1;
    for (let index = 1; index < table.length; index++) {
        if (table.get(index) === null) {
            slot = index;
            break;
        }
    }
    if (slot < 0) {
        throw new Error('No free slot in the function table');
    }
    table.set(slot, trampoline);

    E.vbSetWriteCallback(sim, slot);
    E.vbReset(sim);

    const simsPtr = E.Realloc(0, 4);
    new Uint32Array(E.memory.buffer, simsPtr, 1)[0] = sim;
    const clocksPtr = E.Realloc(0, 4);

    try {
        // Emulate takes a pointer to the clock budget and decrements it, so it
        // has to be driven the way the worker's drive loop does.
        E.vbSetSamples(sim, E.GetExtSamples(sim), 5, 834);
        new Uint32Array(E.memory.buffer, clocksPtr, 1)[0] = 400000;
        let guard = 0;
        while (new Uint32Array(E.memory.buffer, clocksPtr, 1)[0] !== 0 && guard++ < 100000) {
            E.Emulate(simsPtr, 1, clocksPtr);
        }
    } catch (error) {
        return { trapped: error.message.split('\n')[0], calls };
    }
    return { calls, callbackIndex: E.vbGetWriteCallback(sim) };
}

// --- Table patching ----------------------------------------------------------

console.log('Table');
{
    const stock = await WebAssembly.instantiate(fs.readFileSync(corePath), {
        env: { emscripten_notify_memory_growth: () => { } }
    });
    const stockTable = stock.instance.exports.__indirect_function_table;
    check('stock table is full', stockTable.length, 5);
    let stockGrew = true;
    try {
        stockTable.grow(1);
    } catch {
        stockGrew = false;
    }
    check('stock table cannot grow', stockGrew, false);

    const patched = await WebAssembly.instantiate(coreBytes, {
        env: { emscripten_notify_memory_growth: () => { } }
    });
    const table = patched.instance.exports.__indirect_function_table;
    check('patched table is wider', table.length, TABLE_SLOTS);
    // The core's own entries must survive the patch, or its defaults break.
    for (let index = 1; index <= 4; index++) {
        check(`slot ${index} still populated`, table.get(index) !== null, true);
    }
    check('slot 0 is still null', table.get(0), null);
    for (let index = 5; index < TABLE_SLOTS; index++) {
        check(`slot ${index} is free`, table.get(index), null);
    }

    patched.instance.exports._initialize();
    const sim = patched.instance.exports.CreateSim();
    check('default frame callback survives', patched.instance.exports.vbGetFrameCallback(sim), 2);
    check('no write callback by default', patched.instance.exports.vbGetWriteCallback(sim), 0);
}

// --- Signature sweep ---------------------------------------------------------

console.log('\nSignature sweep');
const survivors = [];
for (let arity = 2; arity <= 8; arity++) {
    for (const returnsValue of [true, false]) {
        const label = `(${'i32,'.repeat(arity).slice(0, -1)}) -> ${returnsValue ? 'i32' : 'void'}`;
        const result = await run(arity, returnsValue);
        if (result.trapped) {
            continue;
        }
        if (result.calls.length > 0) {
            survivors.push({ label, arity, returnsValue, ...result });
            console.log(`  ${label} fired ${result.calls.length} time(s)`);
        }
    }
}

check('exactly one signature fires', survivors.length, 1);

if (survivors.length === 1) {
    const [found] = survivors;
    check('arity', found.arity, 6);
    check('returns a value', found.returnsValue, true);
    check('the callback index round-trips', found.callbackIndex > 0, true);

    // One st.b means exactly one write, so anything else would mean the
    // callback is firing for reads or fetches too.
    check('one store produces one call', found.calls.length, 1);

    const [call] = found.calls;
    console.log(`\n  args  ${call.args.map(a => '0x' + (a >>> 0).toString(16).padStart(8, '0')).join(' ')}`);
    console.log(`  deref ${call.deref.map(v => v === undefined ? '         -' : '0x' + (v >>> 0).toString(16).padStart(8, '0')).join(' ')}`);

    check('argument 1 is the address', call.args[1] >>> 0, TERMINAL_PORT);
    check('argument 2 is the 8-bit data type', call.args[2], 0);
    check('argument 3 points at the value', call.deref[3], TERMINAL_BYTE);
    check('argument 0 is a pointer, the simulation', call.deref[0] !== undefined, true);
}

console.log(failures === 0
    ? '\nAll checks passed. Write callback ABI: (sim, address, type, valuePtr, outA, outB) -> int'
    : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
