// Establishes how big a cartridge RAM buffer the core needs, and how much the
// buffer's initial contents matter.
//
// The studio used to hand the core an 8 KiB, zero-filled buffer when a ROM had
// no .srm yet. That is the size of the SRAM chip, but not the size of the
// window it occupies: only the low byte of each halfword is wired, and the core
// indexes cart RAM by masked address (core/bus.c: cart.ram[address & ramMask]),
// so an 8 KiB buffer makes 0x06002000.. mirror onto 0x06000000.. and a game's
// own writes overwrite each other. Lemur, running the same core, allocates
// 16 KiB and randomizes every even byte.
//
// Booting Zero Racers under the two sizes and three fills shows the split
// cleanly: every 8 KiB run resumes a bogus saved game, every >=16 KiB run
// reaches ENTER YOUR NAME, and the fill makes no difference either way.
//
// Usage: node scripts/sram-init-probe.mjs "<rom path>" [frames] [out dir]
//   SHOTS=100,200  frames to write a PNG of
//   TRACE=1        write a per-frame screen hash list, to find where two
//                  configurations first diverge
//   CONFIGS=[...]  JSON array of { label, size, kind } to run instead of the
//                  default sweep; kind is zero | ff | random-even | random-all
import fs from 'fs';
import zlib from 'zlib';
import path from 'path';
import os from 'os';

const romPath = process.argv[2];
const FRAMES = Number(process.argv[3] ?? 600);
const outDir = process.argv[4] ?? path.join(os.tmpdir(), 'ves-sram-probe');
fs.mkdirSync(outDir, { recursive: true });

const corePath = new URL(
    '../applications/electron/binaries/vuengine-studio-tools/web/shrooms-vb-core/core.wasm',
    import.meta.url
);
const coreBytes = fs.readFileSync(corePath);
const ROM = fs.readFileSync(romPath);

const CLOCKS_PER_FRAME = 20000000 / 50;
const WIDTH = 384, HEIGHT = 224;

// Deterministic PRNG so runs are reproducible.
function mulberry(seed) {
    return () => {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return (t ^ t >>> 14) >>> 0;
    };
}

function makeRam(kind, size) {
    const ram = new Uint8Array(size);
    if (kind === 'random-even') {
        const rand = mulberry(0x5eed);
        for (let i = 0; i < size; i += 2) ram[i] = rand() & 0xff;
    } else if (kind === 'random-all') {
        const rand = mulberry(0x5eed);
        for (let i = 0; i < size; i++) ram[i] = rand() & 0xff;
    } else if (kind === 'ff') {
        ram.fill(0xff);
    }
    return ram;
}

async function boot({ label, size, kind, frames = FRAMES }) {
    const { instance } = await WebAssembly.instantiate(coreBytes, {
        env: { emscripten_notify_memory_growth: () => { } }
    });
    const E = instance.exports;
    E._initialize();

    const romPtr = E.Realloc(0, ROM.length);
    new Uint8Array(E.memory.buffer, romPtr, ROM.length).set(ROM);

    const sim = E.CreateSim();
    if (E.vbSetCartROM(sim, romPtr, ROM.length) !== 0) throw new Error('ROM rejected');
    E.SetAnaglyph(sim, 0xff0000, 0x00ff00);

    const ram = makeRam(kind, size);
    const ramPtr = E.Realloc(0, size);
    new Uint8Array(E.memory.buffer, ramPtr, size).set(ram);
    if (E.vbSetCartRAM(sim, ramPtr, size) !== 0) throw new Error('RAM rejected');

    E.vbSetSamples(sim, E.GetExtSamples(sim), 5, 834);
    E.vbReset(sim);

    const simsPtr = E.Realloc(0, 4);
    new Uint32Array(E.memory.buffer, simsPtr, 1)[0] = sim;
    const clocksPtr = E.Realloc(0, 4);

    const trace = [];
    const shotFrames = new Set((process.env.SHOTS ?? '').split(',').filter(Boolean).map(Number));
    // Start (0x1000) and A (0x0004), tapped for six frames each second, so the
    // boot screens and menus advance without a human at the pad.
    const AUTO_KEYS = 0x1004;
    for (let frame = 0; frame < frames; frame++) {
        E.vbSetKeys(sim, frame % 50 < 6 ? AUTO_KEYS : 0);
        new Uint32Array(E.memory.buffer, clocksPtr, 1)[0] = CLOCKS_PER_FRAME;
        let guard = 0;
        while (new Uint32Array(E.memory.buffer, clocksPtr, 1)[0] !== 0 && guard++ < 1000) {
            E.Emulate(simsPtr, 1, clocksPtr);
        }
        E.vbSetSamples(sim, E.GetExtSamples(sim), 5, 834);
        if (process.env.TRACE) {
            E.GetPixels(sim);
            trace.push(hash(new Uint8Array(E.memory.buffer, E.GetExtPixels(sim), WIDTH * HEIGHT * 4)));
        }
        if (shotFrames.has(frame)) {
            E.GetPixels(sim);
            const shot = new Uint8Array(E.memory.buffer, E.GetExtPixels(sim), WIDTH * HEIGHT * 4).slice();
            png(shot, `${outDir}/${path.basename(romPath).replace(/\W+/g, '-')}.${label}.f${frame}.png`);
        }
    }

    E.GetPixels(sim);
    const pixels = new Uint8Array(E.memory.buffer, E.GetExtPixels(sim), WIDTH * HEIGHT * 4).slice();
    const finalRam = new Uint8Array(E.memory.buffer, ramPtr, size).slice();

    return { label, size, kind, pixels, ram, finalRam, trace, pc: E.vbGetProgramCounter(sim) };
}

function png(pixels, file) {
    const raw = Buffer.alloc((WIDTH * 4 + 1) * HEIGHT);
    for (let y = 0; y < HEIGHT; y++) {
        raw[y * (WIDTH * 4 + 1)] = 0;
        Buffer.from(pixels.buffer, pixels.byteOffset + y * WIDTH * 4, WIDTH * 4)
            .copy(raw, y * (WIDTH * 4 + 1) + 1);
    }
    const chunk = (type, data) => {
        const out = Buffer.alloc(8 + data.length + 4);
        out.writeUInt32BE(data.length, 0);
        out.write(type, 4, 'ascii');
        data.copy(out, 8);
        const crcBuf = Buffer.concat([Buffer.from(type, 'ascii'), data]);
        out.writeUInt32BE(crc32(crcBuf) >>> 0, 8 + data.length);
        return out;
    };
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(WIDTH, 0); ihdr.writeUInt32BE(HEIGHT, 4);
    ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
    fs.writeFileSync(file, Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk('IHDR', ihdr),
        chunk('IDAT', zlib.deflateSync(raw)),
        chunk('IEND', Buffer.alloc(0)),
    ]));
}

let crcTable = null;
function crc32(buf) {
    if (!crcTable) {
        crcTable = new Int32Array(256);
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
            crcTable[n] = c;
        }
    }
    let c = -1;
    for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return c ^ -1;
}

const hash = bytes => {
    let h = 0x811c9dc5;
    for (let i = 0; i < bytes.length; i++) { h ^= bytes[i]; h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16).padStart(8, '0');
};

const configs = (process.env.CONFIGS ? JSON.parse(process.env.CONFIGS) : [
    { label: 'studio-8k-zero', size: 8192, kind: 'zero' },
    { label: 'lemur-16k-random-even', size: 16384, kind: 'random-even' },
    { label: 'ctrl-16k-zero', size: 16384, kind: 'zero' },
    { label: 'ctrl-16k-ff', size: 16384, kind: 'ff' },
]);

const base = path.basename(romPath).replace(/\W+/g, '-');
console.log(`ROM ${romPath} (${ROM.length} bytes), ${FRAMES} frames\n`);
for (const config of configs) {
    const result = await boot(config);
    const file = `${outDir}/${base}.${config.label}.png`;
    png(result.pixels, file);
    const dirty = [];
    for (let i = 0; i < result.ram.length; i++) {
        if (result.ram[i] !== result.finalRam[i]) dirty.push(i);
    }
    console.log(`${config.label.padEnd(24)} screen=${hash(result.pixels)} pc=0x${(result.pc >>> 0).toString(16)} ` +
        `ramWrites=${dirty.length}${dirty.length ? ` first=0x${dirty[0].toString(16)} last=0x${dirty[dirty.length - 1].toString(16)}` : ''}`);
    console.log(`  -> ${file}`);
    if (process.env.TRACE) {
        fs.writeFileSync(`${outDir}/${config.label}.trace.txt`, result.trace.join('\n'));
    }
}
