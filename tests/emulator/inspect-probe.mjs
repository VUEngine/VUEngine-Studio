// The inspection primitives behind the debug panels: memory reads through the
// CPU's view of the bus, register reads, and the core's own disassembler.
//
// Usage: node scripts/inspect-probe.mjs <path/to/rom.vb>
import fs from 'fs';

const romPath = process.argv[2];
if (!romPath) {
    console.error('Usage: node scripts/inspect-probe.mjs <path/to/rom.vb>');
    process.exit(1);
}

const CLOCKS = 400000, F32 = 5, SAMPLES = 834, U8 = 1;
const corePath = '/Users/chris/dev/VUEngine-Studio/applications/electron/binaries/vuengine-studio-tools/web/shrooms-vb-core/core.wasm';
const { instance } = await WebAssembly.instantiate(fs.readFileSync(corePath), {
    env: { emscripten_notify_memory_growth: () => {} }
});
const E = instance.exports;
E._initialize();

const rom = fs.readFileSync(romPath);
const romPtr = E.Realloc(0, rom.length);
new Uint8Array(E.memory.buffer, romPtr, rom.length).set(rom);
const sim = E.CreateSim();
if (E.vbSetCartROM(sim, romPtr, rom.length) !== 0) throw new Error('ROM rejected');
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
    }
}
for (let i = 0; i < 250; i++) runFrame();

let failures = 0;
const check = (label, ok, detail = '') => {
    if (!ok) failures++;
    console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`);
};

// --- Memory reads, as VesVbWorker#readMemory does them.
const readMemory = (address, length) => {
    const out = new Uint8Array(length);
    for (let i = 0; i < length; i++) out[i] = E.vbRead(sim, (address + i) >>> 0, U8) & 0xFF;
    return out;
};

console.log('=== memory ===');
const romWindow = readMemory(0x07000000, 64);
const romDirect = rom.subarray(0, 64);
check('cartridge ROM reads back what was loaded', romWindow.every((b, i) => b === romDirect[i]));

const wram = readMemory(0x05000000, 256);
check('WRAM is readable', wram.length === 256,
    `first bytes ${[...wram.slice(0, 8)].map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
check('WRAM is not blank after boot', wram.some(b => b !== 0 && b !== 0xFF));

// --- VIP registers, which the VIP panel reads as one block.
console.log('\n=== VIP registers ===');
const vip = readMemory(0x0005F800, 0x80);
const reg = offset => vip[offset] | (vip[offset + 1] << 8);
check('block is readable', vip.length === 0x80);
console.log(`      INTPND=${reg(0x00).toString(16).padStart(4, '0')}` +
    `  DPSTTS=${reg(0x20).toString(16).padStart(4, '0')}` +
    `  XPSTTS=${reg(0x40).toString(16).padStart(4, '0')}` +
    `  BRTA=${reg(0x24).toString(16).padStart(4, '0')}` +
    `  BKCOL=${reg(0x70).toString(16).padStart(4, '0')}`);
check('a running game has configured the display', reg(0x20) !== 0 || reg(0x22) !== 0);

// --- Registers.
console.log('\n=== CPU registers ===');
const pc = E.vbGetProgramCounter(sim) >>> 0;
check('program counter is in cartridge ROM', pc >= 0x07000000, `PC=${pc.toString(16)}`);
check('r0 is hardwired to zero', (E.vbGetProgramRegister(sim, 0) >>> 0) === 0);
const nonZero = Array.from({ length: 32 }, (u, i) => E.vbGetProgramRegister(sim, i) >>> 0)
    .filter(v => v !== 0).length;
check('general registers hold live values', nonZero > 4, `${nonZero} of 32 non-zero`);
check('PSW is readable', Number.isFinite(E.vbGetSystemRegister(sim, 5)));

// --- Disassembly, walked exactly as VesVbWorker#disassemble does.
console.log('\n=== disassembly at the program counter ===');
const COUNT = 8;
const dasm = E.vbuDisassemble(sim, pc, 0, COUNT, 0);
check('disassembler accepted the address', dasm !== 0);

if (dasm !== 0) {
    const table = E.Realloc(0, COUNT * 17 * 4);
    E.GetDasm(table, dasm, COUNT);
    const words = new Uint32Array(E.memory.buffer, table, COUNT * 17);
    const bytes = new Uint8Array(E.memory.buffer);
    const str = p => { let e = p; while (bytes[e] !== 0) e++; return new TextDecoder().decode(bytes.subarray(p, e)); };

    let at = 0;
    let sawPC = false;
    for (let line = 0; line < COUNT; line++) {
        const address = words[at++];
        const codeLength = words[at++];
        const code = [];
        for (let i = 0; i < codeLength; i++) code.push(words[at++]);
        at += 4 - codeLength;
        const isPC = words[at++] !== 0;
        at++; at += 4;
        const mnemonic = str(dasm + words[at++]);
        const operandCount = words[at++];
        const operands = [];
        for (let i = 0; i < operandCount; i++) operands.push(str(dasm + words[at++]));
        at += 3 - operandCount;
        if (isPC) sawPC = true;
        console.log(`      ${address.toString(16).padStart(8, '0')}  ` +
            `${code.map(c => c.toString(16).padStart(4, '0')).join(' ').padEnd(14)}  ` +
            `${mnemonic.padEnd(8)} ${operands.join(', ')}`);
    }
    E.Realloc(table, 0);
    E.Realloc(dasm, 0);
    check('the first line is the program counter', sawPC);
}

console.log(`\n${failures === 0 ? 'Inspection primitives are correct.' : failures + ' FAILURES'}`);
process.exit(failures === 0 ? 0 : 1);
