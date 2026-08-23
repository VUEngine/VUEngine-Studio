// Cross-simulation save state restore, which is what loading a state file from
// disk actually does: the snapshot was taken by a simulation whose cart ROM,
// cart RAM and sample buffers live at different addresses.
//
// Mirrors VesVbWorker#restore: memcpy the blob, then re-apply this
// simulation's own pointers via the core's setters.
import fs from 'fs';

const path = '/Users/chris/dev/VUEngine-Studio/applications/electron/binaries/vuengine-studio-tools/web/shrooms-vb-core/core.wasm';
const { instance } = await WebAssembly.instantiate(fs.readFileSync(path), {
    env: { emscripten_notify_memory_growth: () => {} }
});
const E = instance.exports;
E._initialize();

const SIZE = E.vbSizeOf();
const F32 = 5, SAMPLES = 834, CLOCKS = 400000;
const RAM_LEN = 8192;

// A real ROM if one is given, otherwise a synthetic instruction stream. Both
// simulations run the same cartridge contents from different addresses.
const romPath = process.argv[2];
let rom;
if (romPath) {
    rom = new Uint8Array(fs.readFileSync(romPath));
} else {
    rom = new Uint8Array(1 << 20);
    for (let i = 0; i < rom.length; i++) rom[i] = (i * 7) & 0xFF;
}
const ROM_LEN = rom.length;
console.log('ROM:', romPath ?? 'synthetic', `(${(ROM_LEN / 1048576).toFixed(0)} MiB)`);

function makeSim() {
    const romPtr = E.Realloc(0, ROM_LEN);
    new Uint8Array(E.memory.buffer, romPtr, ROM_LEN).set(rom);
    const ramPtr = E.Realloc(0, RAM_LEN);
    new Uint8Array(E.memory.buffer, ramPtr, RAM_LEN).fill(0);
    const sim = E.CreateSim();
    if (E.vbSetCartROM(sim, romPtr, ROM_LEN) !== 0) throw new Error('ROM rejected');
    if (E.vbSetCartRAM(sim, ramPtr, RAM_LEN) !== 0) throw new Error('RAM rejected');
    E.vbReset(sim);
    return { sim, romPtr, ramPtr, samples: E.GetExtSamples(sim) };
}

const simsPtr = E.Realloc(0, 4);
const clocksPtr = E.Realloc(0, 4);

function run(target, chunks) {
    new Uint32Array(E.memory.buffer, simsPtr, 1)[0] = target.sim;
    for (let c = 0; c < chunks; c++) {
        E.vbSetSamples(target.sim, target.samples, F32, SAMPLES);
        new Uint32Array(E.memory.buffer, clocksPtr, 1)[0] = CLOCKS;
        let guard = 0;
        while (new Uint32Array(E.memory.buffer, clocksPtr, 1)[0] !== 0 && guard++ < 100000) {
            E.Emulate(simsPtr, 1, clocksPtr);
        }
    }
}

const snap = t => new Uint8Array(E.memory.buffer, t.sim, SIZE).slice();

// Exactly what the worker does on loadState.
function restore(target, blob) {
    new Uint8Array(E.memory.buffer, target.sim, SIZE).set(blob);
    E.vbSetCartROM(target.sim, target.romPtr, ROM_LEN);
    E.vbSetCartRAM(target.sim, target.ramPtr, RAM_LEN);
    E.vbSetSamples(target.sim, target.samples, F32, SAMPLES);
}

const a = makeSim();
const b = makeSim();
console.log('sim A at', a.sim, '| sim B at', b.sim);
console.log('their buffers differ:',
    a.romPtr !== b.romPtr && a.ramPtr !== b.ramPtr && a.samples !== b.samples);

// Advance A, snapshot it, keep going.
run(a, 10);
const blob = snap(a);
run(a, 25);
const expected = snap(a);

// Restore A's snapshot into B and replay the same amount of time.
restore(b, blob);
run(b, 25);
const actual = snap(b);

// The three embedded pointers are meant to differ; nothing else should.
const POINTER_OFFSETS = [0, 4, 1876044];
const diffs = [];
for (let off = 0; off < SIZE; off++) {
    if (expected[off] !== actual[off]) diffs.push(off);
}
const unexpected = diffs.filter(off => !POINTER_OFFSETS.some(p => off >= p && off < p + 4));

console.log('\n=== cross-simulation restore ===');
console.log('bytes differing overall      :', diffs.length);
console.log('differing outside pointers   :', unexpected.length,
    unexpected.length === 0 ? '(states match)' : `(FIRST AT ${unexpected.slice(0, 8)})`);
console.log('PC after replay  A / B       :',
    E.vbGetProgramCounter(a.sim).toString(16), '/', E.vbGetProgramCounter(b.sim).toString(16));
console.log('B still points at its own ROM:', E.vbGetCartROM(b.sim) === b.romPtr);
console.log('B still points at its own RAM:', E.vbGetCartRAM(b.sim) === b.ramPtr);

// Without the fixups, B would be left pointing into A's buffers.
const naive = makeSim();
new Uint8Array(E.memory.buffer, naive.sim, SIZE).set(blob);
console.log('\n=== without the fixups (why they exist) ===');
console.log('naive restore points at A\'s ROM:', E.vbGetCartROM(naive.sim) === a.romPtr);
console.log('naive restore points at A\'s RAM:', E.vbGetCartRAM(naive.sim) === a.ramPtr);

const ok = unexpected.length === 0 && E.vbGetProgramCounter(a.sim) === E.vbGetProgramCounter(b.sim);
console.log(`\n${ok ? 'Cross-simulation restore is correct.' : 'FAILED'}`);
process.exit(ok ? 0 : 1);
