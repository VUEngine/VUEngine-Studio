// End-to-end rewind test against a real game, using the shipped codec from
// lib/emulator/worker/ves-vb-rewind.js rather than a reimplementation.
//
// Plays forward capturing reverse deltas, then rewinds the whole way and
// asserts every restored state is byte-identical to what was recorded live.
//
// Usage: node scripts/rewind-probe.mjs <path/to/rom.vb>
import fs from 'fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { encodeDelta, applyDelta, createRunScratch } =
    require('../../extensions/vuengine-studio-extension/lib/emulator/worker/ves-vb-rewind.js');

const romPath = process.argv[2];
if (!romPath) {
    console.error('Usage: node scripts/rewind-probe.mjs <path/to/rom.vb>');
    process.exit(1);
}

const CLOCKS = 400000, F32 = 5, SAMPLES = 834, BREAK_FRAME = 1;
const BOOT_FRAMES = 250;
const CAPTURES = 200;

const corePath = '/Users/chris/dev/VUEngine-Studio/applications/electron/binaries/vuengine-studio-tools/web/shrooms-vb-core/core.wasm';
const { instance } = await WebAssembly.instantiate(fs.readFileSync(corePath), {
    env: { emscripten_notify_memory_growth: () => { } }
});
const E = instance.exports;
E._initialize();

const SIZE = E.vbSizeOf();
const rom = fs.readFileSync(romPath);
const romPtr = E.Realloc(0, rom.length);
new Uint8Array(E.memory.buffer, romPtr, rom.length).set(rom);

const sim = E.CreateSim();
if (E.vbSetCartROM(sim, romPtr, rom.length) !== 0) throw new Error('Core rejected the ROM');
const ramPtr = E.Realloc(0, 8192);
new Uint8Array(E.memory.buffer, ramPtr, 8192).fill(0);
E.vbSetCartRAM(sim, ramPtr, 8192);
E.vbSetKeys(sim, 0x0002);
E.vbReset(sim);

const samplesPtr = E.GetExtSamples(sim);
const simsPtr = E.Realloc(0, 4);
const clocksPtr = E.Realloc(0, 4);
new Uint32Array(E.memory.buffer, simsPtr, 1)[0] = sim;

function runFrame() {
    E.vbSetSamples(sim, samplesPtr, F32, SAMPLES);
    new Uint32Array(E.memory.buffer, clocksPtr, 1)[0] = CLOCKS;
    let guard = 0;
    while (new Uint32Array(E.memory.buffer, clocksPtr, 1)[0] !== 0 && guard++ < 200000) {
        E.Emulate(simsPtr, 1, clocksPtr);
        if (E.GetBreaks(sim) & BREAK_FRAME) { /* frame drawn */ }
    }
}

const live = () => new Uint8Array(E.memory.buffer, sim, SIZE);

for (let i = 0; i < BOOT_FRAMES; i++) runFrame();

// --- Play forward, capturing exactly as VesVbWorker#captureRewindEntry does.
const scratch = createRunScratch();
let mirror = live().slice();
const entries = [];
const truth = [mirror.slice()];   // state at each capture, for comparison
let bytes = 0;

for (let i = 0; i < CAPTURES; i++) {
    runFrame();
    const current = live();
    const delta = encodeDelta(mirror, current, scratch);
    entries.push(delta);
    bytes += delta.length;
    mirror.set(current);
    truth.push(mirror.slice());
}

console.log(`ROM        : ${romPath}`);
console.log(`captures   : ${CAPTURES} at granularity 1`);
console.log(`delta bytes: ${(bytes / 1024).toFixed(1)} KiB total, ` +
    `${(bytes / CAPTURES / 1024).toFixed(1)} KiB avg`);
console.log(`vs raw     : ${(CAPTURES * SIZE / 1048576).toFixed(0)} MiB, ` +
    `so ${(CAPTURES * SIZE / bytes).toFixed(1)}x smaller\n`);

// --- Rewind the whole way, exactly as VesVbWorker#rewindStep does.
let mismatches = 0;
let firstMismatch = -1;
for (let i = CAPTURES - 1; i >= 0; i--) {
    applyDelta(mirror, entries.pop());
    // The worker copies the mirror straight back into the simulation.
    live().set(mirror);

    const expected = truth[i];
    let equal = true;
    for (let b = 0; b < SIZE; b++) {
        if (mirror[b] !== expected[b]) { equal = false; break; }
    }
    if (!equal) {
        mismatches++;
        if (firstMismatch < 0) firstMismatch = CAPTURES - i;
    }
}

console.log('=== rewinding all the way back ===');
console.log(`steps taken            : ${CAPTURES}`);
console.log(`states byte-identical  : ${CAPTURES - mismatches} / ${CAPTURES}`);
if (mismatches) console.log(`first mismatch at step : ${firstMismatch}`);

// The emulator must still run correctly from a rewound state.
E.vbSetCartROM(sim, romPtr, rom.length);
E.vbSetCartRAM(sim, ramPtr, 8192);
E.vbSetSamples(sim, samplesPtr, F32, SAMPLES);
const pcBefore = E.vbGetProgramCounter(sim);
for (let i = 0; i < 25; i++) runFrame();
const pcAfter = E.vbGetProgramCounter(sim);
console.log(`resumed from rewound state: PC ${pcBefore.toString(16)} -> ${pcAfter.toString(16)}`);

const ok = mismatches === 0 && pcAfter !== pcBefore;
console.log(`\n${ok ? 'Rewind is byte-exact and resumes cleanly.' : 'FAILED'}`);
process.exit(ok ? 0 : 1);
