// Link cable wiring: two simulations in one core, peered over the link port.
//
// Verifies what can be checked without a ROM that drives the link port --
// that peering is bidirectional and survives, that both machines really do
// emulate together in one core, and that a linked pair snapshots and restores
// as a unit. Actual data crossing the cable needs a link-aware ROM.
//
// Usage: node scripts/link-probe.mjs [path/to/rom.vb]
import fs from 'fs';

const CLOCKS = 400000, F32 = 5, SAMPLES = 834, RAM_LEN = 8192;

const corePath = '/Users/chris/dev/VUEngine-Studio/applications/electron/binaries/vuengine-studio-tools/web/shrooms-vb-core/core.wasm';
const { instance } = await WebAssembly.instantiate(fs.readFileSync(corePath), {
    env: { emscripten_notify_memory_growth: () => {} }
});
const E = instance.exports;
E._initialize();

const SIZE = E.vbSizeOf();
const romPath = process.argv[2];
let rom;
if (romPath) {
    rom = new Uint8Array(fs.readFileSync(romPath));
} else {
    rom = new Uint8Array(1 << 20);
    for (let i = 0; i < rom.length; i++) rom[i] = (i * 7) & 0xFF;
}
console.log('ROM:', romPath ?? 'synthetic', `(${(rom.length / 1048576).toFixed(0)} MiB)\n`);

function makeSim() {
    const romPtr = E.Realloc(0, rom.length);
    new Uint8Array(E.memory.buffer, romPtr, rom.length).set(rom);
    const ramPtr = E.Realloc(0, RAM_LEN);
    new Uint8Array(E.memory.buffer, ramPtr, RAM_LEN).fill(0);
    const sim = E.CreateSim();
    if (E.vbSetCartROM(sim, romPtr, rom.length) !== 0) throw new Error('ROM rejected');
    if (E.vbSetCartRAM(sim, ramPtr, RAM_LEN) !== 0) throw new Error('RAM rejected');
    E.vbSetKeys(sim, 0x0002);
    E.vbReset(sim);
    return { sim, romPtr, ramPtr, samples: E.GetExtSamples(sim) };
}

const a = makeSim();
const b = makeSim();

// Both simulations are driven by one Emulate() call, as the worker does for a
// linked session.
const simsPtr = E.Realloc(0, 8);
const clocksPtr = E.Realloc(0, 4);
const pointers = new Uint32Array(E.memory.buffer, simsPtr, 2);
pointers[0] = a.sim;
pointers[1] = b.sim;

function runBoth(frames) {
    for (let f = 0; f < frames; f++) {
        E.vbSetSamples(a.sim, a.samples, F32, SAMPLES);
        E.vbSetSamples(b.sim, b.samples, F32, SAMPLES);
        new Uint32Array(E.memory.buffer, clocksPtr, 1)[0] = CLOCKS;
        let guard = 0;
        while (new Uint32Array(E.memory.buffer, clocksPtr, 1)[0] !== 0 && guard++ < 200000) {
            E.Emulate(simsPtr, 2, clocksPtr);
        }
    }
}

let failures = 0;
const check = (label, actual, expected) => {
    const ok = actual === expected;
    if (!ok) failures++;
    console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${ok ? '' : `  got ${actual}, expected ${expected}`}`);
};

console.log('=== peering ===');
check('unpeered A has no peer', E.vbGetPeer(a.sim), 0);
E.vbSetPeer(a.sim, b.sim);
E.vbSetPeer(b.sim, a.sim);
check('A points at B', E.vbGetPeer(a.sim), b.sim);
check('B points at A', E.vbGetPeer(b.sim), a.sim);

console.log('\n=== both machines run in one core ===');
const pcA0 = E.vbGetProgramCounter(a.sim);
const pcB0 = E.vbGetProgramCounter(b.sim);
runBoth(120);
const pcA1 = E.vbGetProgramCounter(a.sim);
const pcB1 = E.vbGetProgramCounter(b.sim);
check('A advanced', pcA1 !== pcA0, true);
check('B advanced', pcB1 !== pcB0, true);
check('peering survived emulation', E.vbGetPeer(a.sim), b.sim);

console.log('\n=== the pair snapshots as a unit ===');
const snapA = new Uint8Array(E.memory.buffer, a.sim, SIZE).slice();
const snapB = new Uint8Array(E.memory.buffer, b.sim, SIZE).slice();
runBoth(60);
const expectedA = new Uint8Array(E.memory.buffer, a.sim, SIZE).slice();
const expectedB = new Uint8Array(E.memory.buffer, b.sim, SIZE).slice();

// Restore both, exactly as the widget does for a linked pair.
const restore = (target, blob) => {
    new Uint8Array(E.memory.buffer, target.sim, SIZE).set(blob);
    E.vbSetCartROM(target.sim, target.romPtr, rom.length);
    E.vbSetCartRAM(target.sim, target.ramPtr, RAM_LEN);
    E.vbSetSamples(target.sim, target.samples, F32, SAMPLES);
};
restore(a, snapA);
restore(b, snapB);
check('peering survived restore', E.vbGetPeer(a.sim), b.sim);

runBoth(60);
const actualA = new Uint8Array(E.memory.buffer, a.sim, SIZE).slice();
const actualB = new Uint8Array(E.memory.buffer, b.sim, SIZE).slice();
const POINTERS = [0, 4, 1876044];
const differs = (x, y) => {
    for (let i = 0; i < SIZE; i++) {
        if (x[i] !== y[i] && !POINTERS.some(p => i >= p && i < p + 4)) return i;
    }
    return -1;
};
check('A replayed identically', differs(expectedA, actualA), -1);
check('B replayed identically', differs(expectedB, actualB), -1);

console.log('\n=== unpeering ===');
E.vbSetPeer(a.sim, 0);
E.vbSetPeer(b.sim, 0);
check('A released', E.vbGetPeer(a.sim), 0);
check('B released', E.vbGetPeer(b.sim), 0);
// A program counter is a poor liveness test: a game loop returns to the same
// instruction every frame, so compare whole states instead.
const beforeA = new Uint8Array(E.memory.buffer, a.sim, SIZE).slice();
const beforeB = new Uint8Array(E.memory.buffer, b.sim, SIZE).slice();
runBoth(10);
check('A still runs unpeered', differs(beforeA, new Uint8Array(E.memory.buffer, a.sim, SIZE)) !== -1, true);
check('B still runs unpeered', differs(beforeB, new Uint8Array(E.memory.buffer, b.sim, SIZE)) !== -1, true);

console.log(`\n${failures === 0
    ? 'Link wiring is correct. Data actually crossing the cable needs a link-aware ROM.'
    : failures + ' FAILURES'}`);
process.exit(failures === 0 ? 0 : 1);
