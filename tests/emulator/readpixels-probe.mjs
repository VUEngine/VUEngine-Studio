// Verifies the framebuffer read the Sound Editor's position readout depends on.
//
// The generated sound player ROM reports how far it has got by drawing its
// elapsed tick count along the top of the screen, one lit-or-unlit pixel per
// bit, eight pixels apart. That used to be recovered by copying the emulator's
// canvas into a shadow canvas and calling getImageData; it is now a readPixels
// call against the core's own composited framebuffer.
//
// This asserts the whole chain by standing in for the player: a hand-assembled
// V810 program writes a known 32-bit pattern into the left framebuffer, turns
// the display on, and the pattern is decoded back out of GetExtPixels exactly
// the way Emulator.tsx decodes it.
//
// Usage: node scripts/readpixels-probe.mjs
import fs from 'fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { patchVesVbTableLimit } =
    require('../../extensions/vuengine-studio-extension/lib/emulator/worker/ves-vb-wasm.js');

const SCREEN_WIDTH = 384;
const SCREEN_HEIGHT = 224;

// Must match Emulator.tsx.
const PLAYER_POSITION_ROW = 1;
const PLAYER_POSITION_BITS = 32;
const PLAYER_POSITION_SPACING = 8;
const PLAYER_POSITION_THRESHOLD = 200;

/** An awkward pattern: alternating, both ends set, never all-ones. */
const PATTERN = 0xa5c3f00f;

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

/**
 * A cartridge that paints PATTERN into the left framebuffer and enables display.
 *
 * Virtual Boy framebuffers are column-major: each of the 384 columns holds 256
 * pixels at two bits each, so a column is 64 bytes and row r lives in byte
 * r >> 2 at bit (r & 3) * 2. Row 1 is therefore the byte at the top of a
 * column, bits 2-3, and a fully lit pixel there is 0x0C.
 *
 * Nothing else draws, because the drawing procedure is left disabled — so what
 * is written stays written.
 */
function buildRom(pattern) {
    const size = 0x100000;
    const rom = new Uint8Array(size);
    const view = new DataView(rom.buffer);

    let at = 0;
    const half = value => {
        view.setUint16(at, value & 0xffff, true);
        at += 2;
    };
    const movhi = (imm, reg1, reg2) => { half((0x2f << 10) | (reg2 << 5) | reg1); half(imm); };
    const movea = (imm, reg1, reg2) => { half((0x28 << 10) | (reg2 << 5) | reg1); half(imm); };
    const stb = (reg2, disp, reg1) => { half((0x34 << 10) | (reg2 << 5) | reg1); half(disp); };
    const sth = (reg2, disp, reg1) => { half((0x35 << 10) | (reg2 << 5) | reg1); half(disp); };

    at = 0x1000;
    movea(0x000c, 0, 11);                 // a lit row-1 pixel
    for (let bit = 0; bit < PLAYER_POSITION_BITS; bit++) {
        if ((pattern >>> bit) & 1) {
            // Column bit*8, byte 0 of that column.
            stb(11, bit * PLAYER_POSITION_SPACING * 64, 0);
        }
    }

    movhi(0x0006, 0, 12); movea(0xf800, 12, 12);   // r12 = VIP registers

    // Without brightness the mixer emits black whatever the framebuffer holds.
    movea(32, 0, 13); sth(13, 0x24, 12);   // BRTA
    movea(64, 0, 13); sth(13, 0x26, 12);   // BRTB
    movea(32, 0, 13); sth(13, 0x28, 12);   // BRTC
    movea(0x00f0, 0, 13); sth(13, 0x60, 12);   // GPLT0
    movea(0x0302, 0, 13); sth(13, 0x22, 12);   // DPCTRL: SYNCE | RE | DISP

    half(0x9400);   // spin

    at = size - 0x10;
    movhi(0xfff0, 0, 10);
    movea(0x1000, 10, 10);
    half((0x06 << 10) | 10);   // jmp [r10]

    return rom;
}

const corePath = new URL(
    '../applications/electron/binaries/vuengine-studio-tools/web/shrooms-vb-core/core.wasm',
    import.meta.url
);
const bytes = patchVesVbTableLimit(new Uint8Array(fs.readFileSync(corePath)));
const { instance } = await WebAssembly.instantiate(bytes, {
    env: { emscripten_notify_memory_growth: () => { } }
});
const E = instance.exports;
E._initialize();

const rom = buildRom(PATTERN);
const romPtr = E.Realloc(0, rom.length);
new Uint8Array(E.memory.buffer, romPtr, rom.length).set(rom);

const sim = E.CreateSim();
if (E.vbSetCartROM(sim, romPtr, rom.length) !== 0) {
    throw new Error('Core rejected the synthetic ROM');
}
const ramPtr = E.Realloc(0, 8192);
new Uint8Array(E.memory.buffer, ramPtr, 8192).fill(0);
E.vbSetCartRAM(sim, ramPtr, 8192);

// Eye-packed, exactly as VesVbWorker configures every simulation.
E.SetAnaglyph(sim, 0xff0000, 0x00ff00);
E.vbReset(sim);

const simsPtr = E.Realloc(0, 4);
new Uint32Array(E.memory.buffer, simsPtr, 1)[0] = sim;
const clocksPtr = E.Realloc(0, 4);
E.vbSetSamples(sim, E.GetExtSamples(sim), 5, 834);
for (let buffer = 0; buffer < 30; buffer++) {
    new Uint32Array(E.memory.buffer, clocksPtr, 1)[0] = 400000;
    let guard = 0;
    while (new Uint32Array(E.memory.buffer, clocksPtr, 1)[0] !== 0 && guard++ < 100000) {
        E.Emulate(simsPtr, 1, clocksPtr);
    }
}

console.log('Display');
check('display enabled', (E.vbRead(sim, 0x0005f820, 3) & 0x0002) !== 0, true);
check('framebuffer holds the first bit', E.vbRead(sim, 0x00000000, 1), 0x0c);

E.GetPixels(sim);
const pixels = new Uint8Array(
    E.memory.buffer,
    E.GetExtPixels(sim),
    SCREEN_WIDTH * SCREEN_HEIGHT * 4
);

/** The rectangle copy VesVbWorker#readPixels performs. */
function readPixels(x, y, width, height) {
    const left = Math.max(0, Math.min(x, SCREEN_WIDTH));
    const top = Math.max(0, Math.min(y, SCREEN_HEIGHT));
    const w = Math.max(0, Math.min(width, SCREEN_WIDTH - left));
    const h = Math.max(0, Math.min(height, SCREEN_HEIGHT - top));
    const out = new Uint8Array(w * h * 4);
    for (let row = 0; row < h; row++) {
        const from = ((top + row) * SCREEN_WIDTH + left) * 4;
        out.set(pixels.subarray(from, from + w * 4), row * w * 4);
    }
    return out;
}

console.log('\nRectangle extraction');
const width = (PLAYER_POSITION_BITS - 1) * PLAYER_POSITION_SPACING + 1;
const row = readPixels(0, PLAYER_POSITION_ROW, width, 1);
check('returned size', row.length, width * 4);

// Every byte must equal the same pixel read straight out of the full buffer.
let mismatches = 0;
for (let x = 0; x < width; x++) {
    for (let channel = 0; channel < 4; channel++) {
        const direct = pixels[(PLAYER_POSITION_ROW * SCREEN_WIDTH + x) * 4 + channel];
        if (row[x * 4 + channel] !== direct) {
            mismatches++;
        }
    }
}
check('matches direct indexing', mismatches, 0);

// A rectangle further in exercises both the row stride and the x offset.
const inset = readPixels(16, 1, 8, 3);
let insetMismatches = 0;
for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 8; x++) {
        const direct = pixels[((1 + y) * SCREEN_WIDTH + 16 + x) * 4];
        if (inset[(y * 8 + x) * 4] !== direct) {
            insetMismatches++;
        }
    }
}
check('offset rectangle matches', insetMismatches, 0);
check('clipped past the right edge', readPixels(SCREEN_WIDTH - 2, 0, 16, 1).length, 2 * 4);
check('clipped past the bottom', readPixels(0, SCREEN_HEIGHT - 1, 4, 16).length, 4 * 4);
check('empty outside the screen', readPixels(SCREEN_WIDTH, 0, 8, 1).length, 0);

console.log('\nDecoding, as Emulator.tsx does it');
let decoded = 0;
for (let bit = 0; bit < PLAYER_POSITION_BITS; bit++) {
    if (row[bit * PLAYER_POSITION_SPACING * 4] > PLAYER_POSITION_THRESHOLD) {
        decoded += (1 << bit);
    }
}
check('tick pattern round-trips', decoded >>> 0, PATTERN >>> 0);

// The red channel carries the left eye, which is what the threshold reads.
const litColumn = PLAYER_POSITION_SPACING * 4 * 0;
check('a lit bit is above the threshold', row[litColumn] > PLAYER_POSITION_THRESHOLD, (PATTERN & 1) === 1);
check('blue is unused by eye packing', row[litColumn + 2], 0);
check('alpha is opaque', row[litColumn + 3], 255);

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
