// Mirrors VesVbWorker#emulateOneBuffer exactly, headlessly, to verify the
// core call sequence (vbSetSamples / Emulate / GetBreaks / GetPixels / Mix)
// and that the loop produces frames at the right rate.
import fs from 'fs';

const CLOCK = 20000000;
const RATE = 41700;
const CLOCKS_PER_BUFFER = CLOCK / 50;      // 400000
const SAMPLES_PER_BUFFER = RATE / 50;      // 834
const MIX_LEN = SAMPLES_PER_BUFFER * 2;
const F32 = 5;
const BREAK_FRAME = 1;
const W = 384, H = 224;

const path = '/Users/chris/dev/VUEngine-Studio/applications/electron/binaries/vuengine-studio-tools/web/shrooms-vb-core/core.wasm';
const { instance } = await WebAssembly.instantiate(fs.readFileSync(path), {
    env: { emscripten_notify_memory_growth: () => {} }
});
const E = instance.exports;
E._initialize();

const u32 = (p, n = 1) => new Uint32Array(E.memory.buffer, p, n);
const f32 = (p, n) => new Float32Array(E.memory.buffer, p, n);

// --- session setup, as VesVbWorker does ---
const clocksPtr = E.Realloc(0, 4);
const mixPtr = E.Realloc(0, MIX_LEN * 4);

const romLen = 1 << 20;
const romPtr = E.Realloc(0, romLen);
new Uint8Array(E.memory.buffer, romPtr, romLen).fill(0);

const sim = E.CreateSim();
const samplesPtr = E.GetExtSamples(sim);
if (E.vbSetCartROM(sim, romPtr, romLen) !== 0) throw new Error('vbSetCartROM rejected the ROM');

const simsPtr = E.Realloc(0, 4);
u32(simsPtr)[0] = sim;

E.SetAnaglyph(sim, 0xFF0000, 0x00FF00);  // eye-packed
E.SetVolume(sim, 1);
E.vbReset(sim);

// --- drive loop ---
const mixBuffer = new Float32Array(MIX_LEN);
let frames = 0;
const BUFFERS = 50;   // one second of emulated time

for (let b = 0; b < BUFFERS; b++) {
    E.vbSetSamples(sim, samplesPtr, F32, SAMPLES_PER_BUFFER);

    u32(clocksPtr)[0] = CLOCKS_PER_BUFFER;
    let guard = 0;
    while (u32(clocksPtr)[0] !== 0) {
        if (guard++ > 100000) throw new Error('Emulate() did not drain the clock budget');
        E.Emulate(simsPtr, 1, clocksPtr);
        if (E.GetBreaks(sim) & BREAK_FRAME) {
            E.GetPixels(sim);
            frames++;
        }
    }

    E.Mix(mixPtr, simsPtr, 1);
    mixBuffer.set(f32(mixPtr, MIX_LEN));
}

const pixels = new Uint8ClampedArray(E.memory.buffer, E.GetExtPixels(sim), W * H * 4);

console.log('=== drive loop over 1s of emulated time ===');
console.log('buffers emulated      :', BUFFERS);
console.log('frame breaks observed :', frames, '(Virtual Boy runs at ~50.2 Hz)');
console.log('framebuffer bytes     :', pixels.length, pixels.length === W * H * 4 ? '(correct)' : '(WRONG)');
console.log('mix buffer floats     :', mixBuffer.length, '(', SAMPLES_PER_BUFFER, 'stereo frames )');
console.log('mix buffer finite     :', mixBuffer.every(Number.isFinite));

// With eye-packed anaglyph the blue channel must stay zero: only R (left) and
// G (right) carry brightness. Alpha must be opaque.
let blueSet = 0, alphaBad = 0;
for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 2] !== 0) blueSet++;
    if (pixels[i + 3] !== 255) alphaBad++;
}
console.log('non-zero blue samples :', blueSet, blueSet === 0 ? '(eye-packing holds)' : '(UNEXPECTED)');
console.log('non-opaque alpha      :', alphaBad);
