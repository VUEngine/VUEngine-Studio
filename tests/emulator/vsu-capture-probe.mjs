// Confirms why the VSU panel cannot poll memory like every other inspector,
// and that the write-watching workaround it uses instead (setVsuCapture /
// readVsu in ves-vb-worker.ts) actually observes what a real program's stores
// would produce.
//
// Two things are checked, both against the shipped core directly:
//
//   1. vbRead never reflects a store to the VSU's range (0x01000000+), whether
//      the store was a real CPU instruction or the debug vbWrite primitive.
//      This is the reason a shadow copy is necessary at all; if the core ever
//      starts allowing these reads, this check starts failing and the
//      workaround (and this probe) can be deleted.
//   2. A callback installed the same way ves-vb-worker.ts installs its shared
//      write-watch callback does see the store and can shadow it correctly —
//      exercised against actual CPU store instructions to a channel register
//      and to waveform RAM, the same as VSUSoundTrack.c and audio.h describe.
//
// See scripts/write-callback-probe.mjs for how the callback ABI itself was
// established; this reuses the same table-patch and trampoline machinery
// rather than reimplementing it.
//
// Usage: node scripts/vsu-capture-probe.mjs
import fs from 'fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { patchVesVbTableLimit, installVesVbCallback } =
    require('../../extensions/vuengine-studio-extension/lib/emulator/worker/ves-vb-wasm.js');

const VB_VSU_BASE = 0x01000000;
const VB_VSU_WATCH_BYTES = 0x580;
const SxLRV_CH0 = 0x01000404;
const WAVEDATA1_SAMPLE0 = 0x01000000;

let failures = 0;
function check(label, actual, expected) {
    if (!Object.is(actual, expected)) {
        failures++;
        console.log(`  FAIL ${label}:\n    got      0x${(actual >>> 0).toString(16)}\n    expected 0x${(expected >>> 0).toString(16)}`);
        return false;
    }
    console.log(`  ok   ${label}`);
    return true;
}

/**
 * A 1 MB cartridge that stores VALUE to two VSU addresses and then spins.
 *
 *   at 0xFFFFFFF0:  movhi 0xFFF0, r0, r10
 *                   movea 0x1000, r10, r10
 *                   jmp   [r10]
 *
 *   at 0x1000:      movhi 0x0100, r0, r10       r10 = 0x01000000
 *                   movea VALUE,  r0, r11
 *                   st.b  r11, 0[r10]           WAVEDATA1 sample 0
 *                   st.b  r11, 0x404[r10]       SxLRV, channel 0
 *                   br 0
 */
function buildRom(value) {
    const size = 0x100000;
    const rom = new Uint8Array(size);
    const view = new DataView(rom.buffer);

    let at = 0;
    const half = v => { view.setUint16(at, v & 0xffff, true); at += 2; };
    const movhi = (imm, reg1, reg2) => { half((0x2f << 10) | (reg2 << 5) | reg1); half(imm); };
    const movea = (imm, reg1, reg2) => { half((0x28 << 10) | (reg2 << 5) | reg1); half(imm); };
    const stb = (reg2, disp, reg1) => { half((0x34 << 10) | (reg2 << 5) | reg1); half(disp); };
    const jmp = reg1 => half((0x06 << 10) | reg1);

    at = 0x1000;
    movhi(0x0100, 0, 10);
    movea(value, 0, 11);
    stb(11, 0, 10);
    stb(11, 0x404, 10);
    half(0x9400); // br 0

    at = size - 0x10;
    movhi(0xfff0, 0, 10);
    movea(0x1000, 10, 10);
    jmp(10);

    return rom;
}

function runToCompletion(E, sim) {
    const simsPtr = E.Realloc(0, 4);
    new Uint32Array(E.memory.buffer, simsPtr, 1)[0] = sim;
    const clocksPtr = E.Realloc(0, 4);
    E.vbSetSamples(sim, E.GetExtSamples(sim), 5, 834);
    new Uint32Array(E.memory.buffer, clocksPtr, 1)[0] = 20000;
    let guard = 0;
    while (new Uint32Array(E.memory.buffer, clocksPtr, 1)[0] !== 0 && guard++ < 100000) {
        E.Emulate(simsPtr, 1, clocksPtr);
    }
}

const corePath = new URL(
    '../applications/electron/binaries/vuengine-studio-tools/web/shrooms-vb-core/core.wasm',
    import.meta.url
);
const VALUE = 0x7a;

console.log('vbRead on the VSU range');
{
    const bytes = patchVesVbTableLimit(new Uint8Array(fs.readFileSync(corePath)));
    const { instance } = await WebAssembly.instantiate(bytes, {
        env: { emscripten_notify_memory_growth: () => { } }
    });
    const E = instance.exports;
    E._initialize();

    const rom = buildRom(VALUE);
    const romPtr = E.Realloc(0, rom.length);
    new Uint8Array(E.memory.buffer, romPtr, rom.length).set(rom);
    const sim = E.CreateSim();
    if (E.vbSetCartROM(sim, romPtr, rom.length) !== 0) {
        throw new Error('Core rejected the synthetic ROM');
    }
    const ramPtr = E.Realloc(0, 8192);
    new Uint8Array(E.memory.buffer, ramPtr, 8192).fill(0);
    E.vbSetCartRAM(sim, ramPtr, 8192);
    E.vbReset(sim);

    runToCompletion(E, sim);

    check('a CPU store to SxLRV does not come back through vbRead', E.vbRead(sim, SxLRV_CH0, 1) & 0xff, 0);
    check('a CPU store to waveform RAM does not come back through vbRead', E.vbRead(sim, WAVEDATA1_SAMPLE0, 1) & 0xff, 0);

    E.vbWrite(sim, SxLRV_CH0, 1, VALUE);
    check('a debug vbWrite to SxLRV does not come back through vbRead either', E.vbRead(sim, SxLRV_CH0, 1) & 0xff, 0);
}

console.log('\nShadow capture, the same way ves-vb-worker.ts drives it');
{
    const bytes = patchVesVbTableLimit(new Uint8Array(fs.readFileSync(corePath)));
    const { instance } = await WebAssembly.instantiate(bytes, {
        env: { emscripten_notify_memory_growth: () => { } }
    });
    const E = instance.exports;
    E._initialize();

    const rom = buildRom(VALUE);
    const romPtr = E.Realloc(0, rom.length);
    new Uint8Array(E.memory.buffer, romPtr, rom.length).set(rom);
    const sim = E.CreateSim();
    E.vbSetCartROM(sim, romPtr, rom.length);
    const ramPtr = E.Realloc(0, 8192);
    new Uint8Array(E.memory.buffer, ramPtr, 8192).fill(0);
    E.vbSetCartRAM(sim, ramPtr, 8192);
    E.vbReset(sim);

    const shadow = new Uint8Array(VB_VSU_WATCH_BYTES);
    const slot = installVesVbCallback(E, (simPointer, address, unusedType, valuePointer) => {
        const at = address >>> 0;
        if (at >= VB_VSU_BASE && at < VB_VSU_BASE + VB_VSU_WATCH_BYTES) {
            shadow[at - VB_VSU_BASE] = new Uint8Array(E.memory.buffer, valuePointer, 1)[0];
        }
        return 0;
    });
    E.vbSetWriteCallback(sim, slot);

    runToCompletion(E, sim);

    check('the shadow saw the store to waveform RAM', shadow[WAVEDATA1_SAMPLE0 - VB_VSU_BASE], VALUE);
    check('the shadow saw the store to SxLRV', shadow[SxLRV_CH0 - VB_VSU_BASE], VALUE);

    E.vbSetWriteCallback(sim, 0);
}

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
