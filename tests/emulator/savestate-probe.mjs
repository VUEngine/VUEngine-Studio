// Probe: is a Shrooms-VB sim state a plain relocatable blob?
// If yes, save states are a memcpy.
//
// NOTE: this probe attaches only a cart ROM, so its pointer scan finds only the
// cart ROM pointer. A simulation with cart RAM and a sample buffer attached
// embeds three pointers (cart RAM at 0, cart ROM at 4, samples at 1876044).
// See scripts/savestate-restore-probe.mjs for the full picture and for the
// cross-simulation restore that save state files actually perform.
import fs from 'fs';

const path = '/Users/chris/dev/VUEngine-Studio/applications/electron/binaries/vuengine-studio-tools/web/shrooms-vb-core/core.wasm';
const wasm = await WebAssembly.instantiate(fs.readFileSync(path), {
    env: { emscripten_notify_memory_growth: () => { mem = null; } }
});
const E = wasm.instance.exports;
let mem = null;
const M = () => (mem ??= new DataView(E.memory.buffer));
const bytes = (ptr, len) => new Uint8Array(E.memory.buffer, ptr, len).slice();

E._initialize();

const size = E.vbSizeOf();
console.log('vbSizeOf() =', size, 'bytes (', (size / 1024).toFixed(1), 'KiB )');
console.log('PointerSize() =', E.PointerSize());

// Build a minimal 1 MiB cart: mostly zeros, infinite-loop at the reset vector.
const romLen = 1 << 20;
const romPtr = E.Realloc(0, romLen);
new Uint8Array(E.memory.buffer, romPtr, romLen).fill(0);
mem = null;
// JR 0 (branch to self) at the very end of ROM == reset vector 0xFFFFFFF0
M().setUint16(romPtr + romLen - 16, 0x0000, true);


const sim = E.CreateSim();
console.log('CreateSim() ->', sim);
E.vbSetCartROM(sim, romPtr, romLen);
E.vbReset(sim);

// Emulate helper: Emulate(pointersPtr, count, clocksPtr)
const simsPtr = E.Realloc(0, 8);
const clocksPtr = E.Realloc(0, 4);
mem = null;
M().setUint32(simsPtr, sim, true);

function run(clocks) {
    M().setUint32(clocksPtr, clocks, true);
    let guard = 0;
    while (M().getUint32(clocksPtr, true) !== 0 && guard++ < 10000) {
        E.Emulate(simsPtr, 1, clocksPtr);
    }
}

function fingerprint() {
    const regs = [];
    for (let i = 0; i < 32; i++) regs.push(E.vbGetProgramRegister(sim, i));
    const wram = bytes(0, 0); // placeholder
    return JSON.stringify({ pc: E.vbGetProgramCounter(sim), regs });
}

// t=1000: snapshot
run(1000);
const snapshot = bytes(sim, size);
const fpAtSnapshot = fingerprint();
console.log('\nsnapshot taken at PC =', E.vbGetProgramCounter(sim).toString(16));

// run further, record where we land
run(50000);
const fpAfter = fingerprint();
const wramAfter = bytes(sim, size); // whole struct incl. embedded WRAM/VRAM
console.log('after +50000 clocks, PC =', E.vbGetProgramCounter(sim).toString(16));

// restore and replay
new Uint8Array(E.memory.buffer, sim, size).set(snapshot);
mem = null;
const fpRestored = fingerprint();
console.log('restored, PC =', E.vbGetProgramCounter(sim).toString(16));
console.log('restore == snapshot state?', fpRestored === fpAtSnapshot);

run(50000);
const fpReplay = fingerprint();
const wramReplay = bytes(sim, size);
console.log('after replay, PC =', E.vbGetProgramCounter(sim).toString(16));

const identical = Buffer.compare(Buffer.from(wramAfter), Buffer.from(wramReplay)) === 0;
console.log('\n=== RESULT ===');
console.log('register fingerprint matches after replay:', fpReplay === fpAfter);
console.log('FULL state blob byte-identical after replay:', identical);

// Look for embedded absolute pointers (would need fixup on cross-session restore)
const view = new DataView(snapshot.buffer);
const hits = [];
for (let off = 0; off + 4 <= size; off += 4) {
    const v = view.getUint32(off, true);
    if (v === romPtr) hits.push(['cartROM', off]);
    else if (v === sim) hits.push(['self', off]);
}
console.log('embedded absolute pointers found:', hits.length, hits.slice(0, 10));
console.log('vbGetCartROM(sim) =', E.vbGetCartROM(sim), ' (romPtr =', romPtr, ')');
