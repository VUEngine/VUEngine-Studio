// How much memory does rewind actually need?
//
// A rewind snapshot is the whole 1.85 MiB state struct. Whether that has to be
// compressed depends on how much of it really changes between frames, which
// only a real game answers -- a blank cartridge barely changes state at all and
// makes every compression figure meaningless.
//
// Usage: node scripts/rewind-cost-probe.mjs [path/to/rom.vb]
import fs from 'fs';
import zlib from 'zlib';

const romPath = process.argv[2];
if (!romPath) {
    console.error('Usage: node scripts/rewind-cost-probe.mjs <path/to/rom.vb>');
    process.exit(1);
}

const CLOCKS = 400000;   // one frame's worth, 0.02s at 20 MHz
const F32 = 5, SAMPLES = 834, BREAK_FRAME = 1;
const BOOT_FRAMES = 250;  // ~5s, to get past boot and into the game
const SAMPLE_FRAMES = 150; // ~3s of measurement

const corePath = '/Users/chris/dev/VUEngine-Studio/applications/electron/binaries/vuengine-studio-tools/web/shrooms-vb-core/core.wasm';
const { instance } = await WebAssembly.instantiate(fs.readFileSync(corePath), {
    env: { emscripten_notify_memory_growth: () => {} }
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
E.vbSetKeys(sim, 0x0002); // SGN: a controller is present
E.vbReset(sim);

const samplesPtr = E.GetExtSamples(sim);
const simsPtr = E.Realloc(0, 4);
const clocksPtr = E.Realloc(0, 4);
new Uint32Array(E.memory.buffer, simsPtr, 1)[0] = sim;

function runFrame() {
    E.vbSetSamples(sim, samplesPtr, F32, SAMPLES);
    new Uint32Array(E.memory.buffer, clocksPtr, 1)[0] = CLOCKS;
    let guard = 0;
    let framed = false;
    while (new Uint32Array(E.memory.buffer, clocksPtr, 1)[0] !== 0 && guard++ < 200000) {
        E.Emulate(simsPtr, 1, clocksPtr);
        if (E.GetBreaks(sim) & BREAK_FRAME) framed = true;
    }
    return framed;
}

const snap = () => new Uint8Array(E.memory.buffer, sim, SIZE).slice();

console.log(`ROM   : ${romPath}`);
console.log(`        ${(rom.length / 1048576).toFixed(0)} MiB, state struct ${(SIZE / 1024).toFixed(1)} KiB\n`);

process.stdout.write(`booting for ${BOOT_FRAMES} frames... `);
const bootStart = Date.now();
let framesSeen = 0;
for (let i = 0; i < BOOT_FRAMES; i++) if (runFrame()) framesSeen++;
const bootMs = Date.now() - bootStart;
console.log(`done (${framesSeen} frames drawn)`);
console.log(`emulation throughput  : ${(BOOT_FRAMES * 20 / bootMs).toFixed(1)}x real time ` +
    `(${(BOOT_FRAMES / (bootMs / 1000)).toFixed(0)} fps)\n`);

/**
 * Sparse XOR run encoding, as implemented in the worker.
 *
 * Emits [uint32 offset][uint32 length][length XOR bytes] per differing run,
 * merging runs separated by less than `gap` bytes so that scattered single-byte
 * changes do not each pay the 8 byte header.
 */
function encodeSparse(previousState, currentState, gap) {
    const runs = [];
    let start = -1, lastDiff = -1;
    for (let i = 0; i < SIZE; i++) {
        if (previousState[i] !== currentState[i]) {
            if (start < 0) start = i;
            else if (i - lastDiff > gap) { runs.push([start, lastDiff]); start = i; }
            lastDiff = i;
        }
    }
    if (start >= 0) runs.push([start, lastDiff]);
    let bytes = 0;
    for (const [from, to] of runs) bytes += 8 + (to - from + 1);
    return { bytes, runs: runs.length };
}

let previous = snap();
let totalChanged = 0, totalDelta = 0, totalRaw = 0;
let peakChanged = 0;
const sparseTotals = new Map([[4, 0], [16, 0], [64, 0]]);
let sparseRuns = 0;
const delta = new Uint8Array(SIZE);

for (let f = 0; f < SAMPLE_FRAMES; f++) {
    runFrame();
    const current = snap();
    let changed = 0;
    for (let i = 0; i < SIZE; i++) {
        const d = current[i] ^ previous[i];
        delta[i] = d;
        if (d !== 0) changed++;
    }
    totalChanged += changed;
    peakChanged = Math.max(peakChanged, changed);
    totalDelta += zlib.deflateRawSync(delta, { level: 1 }).length;
    totalRaw += zlib.deflateRawSync(current, { level: 1 }).length;
    for (const gap of sparseTotals.keys()) {
        const encoded = encodeSparse(previous, current, gap);
        sparseTotals.set(gap, sparseTotals.get(gap) + encoded.bytes);
        if (gap === 16) sparseRuns += encoded.runs;
    }
    previous = current;
}

const kib = n => (n / 1024).toFixed(1) + ' KiB';
const avgChanged = totalChanged / SAMPLE_FRAMES;
const avgDelta = totalDelta / SAMPLE_FRAMES;
const avgRaw = totalRaw / SAMPLE_FRAMES;

console.log(`=== churn over ${SAMPLE_FRAMES} frames ===`);
console.log(`changed per frame     : ${kib(avgChanged)} avg, ${kib(peakChanged)} peak ` +
    `(${(100 * avgChanged / SIZE).toFixed(1)}% of the struct)`);
console.log(`raw snapshot          : ${kib(SIZE)}`);
console.log(`deflated snapshot     : ${kib(avgRaw)}  (${(SIZE / avgRaw).toFixed(1)}x)`);
console.log(`deflated XOR delta    : ${kib(avgDelta)}  (${(SIZE / avgDelta).toFixed(1)}x)`);

console.log('\n=== sparse XOR runs (no compression library, synchronous) ===');
let bestGap = 16;
for (const [gap, total] of sparseTotals) {
    const avg = total / SAMPLE_FRAMES;
    console.log(`gap ${String(gap).padStart(2)}: ${kib(avg).padStart(10)}  (${(SIZE / avg).toFixed(1)}x)` +
        (gap === 16 ? `   ~${(sparseRuns / SAMPLE_FRAMES).toFixed(0)} runs/frame` : ''));
    if (total < sparseTotals.get(bestGap)) bestGap = gap;
}
const avgSparse = sparseTotals.get(bestGap) / SAMPLE_FRAMES;

console.log('\n=== rewind duration for a 128 MB budget ===');
for (const granularity of [1, 2, 4, 8]) {
    const line = perState => {
        const states = Math.floor(128 * 1048576 / perState);
        return `${(states * granularity / 50).toFixed(0)}s`.padStart(6);
    };
    console.log(`granularity ${granularity}:  raw ${line(SIZE)}  |  deflated ${line(avgRaw)}` +
        `  |  sparse XOR ${line(avgSparse)}  |  deflated delta ${line(avgDelta)}`);
}
console.log(`\nbest sparse gap: ${bestGap}`);
