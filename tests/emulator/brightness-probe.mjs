// Where the display's four brightness levels land in the framebuffer the core
// hands the renderer, which is what VB_LEVEL_STOPS encodes.
//
// The core resolves a pixel's 2-bit value into a brightness before we ever see
// it, so the renderer cannot key a palette off the pixel value. It has to key
// off the resolved level — and those levels are not evenly spaced: the core
// puts them on a gamma-like curve, so a game running at the brightness VUEngine
// configures by default (BRTA 32, BRTB 64, BRTC 32) comes out at 105, 162 and
// 250 rather than 85, 170 and 255.
//
// Runs headless against the vendored core with drawing disabled, so the frame
// buffers keep the pixel values this script paints into them.
import fs from 'fs';

const CORE = new URL(
    '../applications/electron/binaries/vuengine-studio-tools/web/shrooms-vb-core/core.wasm',
    import.meta.url
);
const { instance } = await WebAssembly.instantiate(fs.readFileSync(CORE), {
    env: { emscripten_notify_memory_growth: () => {} }
});
const E = instance.exports;
E._initialize();

const U8 = 1, U16 = 3;
const W = 384;
const CLOCKS_PER_FRAME = 400000;

// VIP registers are halfword-indexed from 0x0005F800 (libgccvb vip.h).
const REG = index => 0x0005F800 + index * 2;
const DPCTRL = REG(0x11);
const BRTA = REG(0x12), BRTB = REG(0x13), BRTC = REG(0x14), REST = REG(0x15);
const FRMCYC = REG(0x17), CTA = REG(0x18), XPCTRL = REG(0x21);
const DISP = 0x0002, RE = 0x0100, SYNCE = 0x0200;

// Frame buffers, left then right (Virtual Boy memory map).
const FRAME_BUFFERS = [0x00000000, 0x00008000, 0x00010000, 0x00018000];
const COLUMN_TABLES = [0x0003DC00, 0x0003DE00];

const romLength = 1 << 20;
const romPointer = E.Realloc(0, romLength);
new Uint8Array(E.memory.buffer, romPointer, romLength).fill(0);
const sim = E.CreateSim();
E.vbSetCartROM(sim, romPointer, romLength);
E.SetAnaglyph(sim, 0xFF0000, 0x00FF00);   // eye-packed, as the worker configures it
E.vbReset(sim);

const clocksPointer = E.Realloc(0, 4);
const simsPointer = E.Realloc(0, 4);
new Uint32Array(E.memory.buffer, simsPointer, 1)[0] = sim;
const clocks = () => new Uint32Array(E.memory.buffer, clocksPointer, 1);

function run(count) {
    clocks()[0] = count;
    let guard = 0;
    while (clocks()[0] !== 0 && guard++ < 100000) {
        E.Emulate(simsPointer, 1, clocksPointer);
        E.GetBreaks(sim);
    }
}

// Column 0 of every column, rows 0..3 = pixel values 0,1,2,3. Frame buffer
// pixels are two bits each, four to a byte, least significant first.
function paint() {
    for (const base of FRAME_BUFFERS) {
        for (let column = 0; column < W; column++) {
            E.vbWrite(sim, base + column * 64, U8, 0b11100100);
        }
    }
}

function setUp() {
    E.vbWrite(sim, XPCTRL, U16, 0);                  // drawing off, keep what we paint
    E.vbWrite(sim, DPCTRL, U16, SYNCE | RE | DISP);  // display on
    E.vbWrite(sim, FRMCYC, U16, 0);
    E.vbWrite(sim, REST, U16, 0);
    E.vbWrite(sim, CTA, U16, 0);
    for (const base of COLUMN_TABLES) {
        for (let entry = 0; entry < 256; entry++) {
            E.vbWrite(sim, base + entry * 2, U16, 0);
        }
    }
}

/** The framebuffer level of each pixel value, for one brightness setting. */
function levels(a, b, c) {
    E.vbWrite(sim, BRTA, U16, a);
    E.vbWrite(sim, BRTB, U16, b);
    E.vbWrite(sim, BRTC, U16, c);
    // The display scans a whole frame before the level is settled.
    for (let frame = 0; frame < 3; frame++) {
        paint();
        run(CLOCKS_PER_FRAME);
    }
    paint();
    E.GetPixels(sim);
    const pixels = new Uint8Array(E.memory.buffer, E.GetExtPixels(sim), W * 224 * 4);
    // Red carries the left eye, green the right, in the eye-packed framebuffer.
    return [0, 1, 2, 3].map(value => pixels[(value * W + 10) * 4]);
}

setUp();

let failures = 0;
function check(label, actual, expected) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (!ok) { failures++; }
    console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}  ${JSON.stringify(actual)}${ok ? '' : ' expected ' + JSON.stringify(expected)}`);
}

console.log('=== The stops VB_LEVEL_STOPS is taken from ===');
// __BRIGHTNESS_DARK_RED / MEDIUM / BRIGHT are 32 / 64 / 128 (Config.h), and
// DisplayUnit.c writes BRTC as bright - (medium + dark), so 32 as well.
check('VUEngine default brightness (32, 64, 32)', levels(32, 64, 32), [0, 105, 162, 250]);

console.log('\n=== The levels are not proportional to the registers ===');
// Halving every register does not halve the levels, which is why the renderer
// interpolates the palette between measured stops rather than even thirds.
check('half brightness (16, 32, 16)', levels(16, 32, 16), [0, 68, 105, 162]);
check('level 1 at 64 equals level 2 at 64', levels(64, 64, 0)[1], levels(32, 64, 32)[2]);

console.log('\n=== A dimmed display lands between the stops ===');
const dimmed = levels(24, 48, 24);
console.log(`     brightness (24, 48, 24) -> ${JSON.stringify(dimmed)}`);
check('every level dims', dimmed.every((level, value) => value === 0 || level < [0, 105, 162, 250][value]), true);

console.log(`\n${failures === 0 ? 'All checks passed.' : `${failures} check(s) failed.`}`);
process.exit(failures === 0 ? 0 : 1);
