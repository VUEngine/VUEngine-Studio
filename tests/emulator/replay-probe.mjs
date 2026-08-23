// Does replaying a recording reproduce the session exactly?
//
// The whole export profiler rests on this: record the machine's state and the
// input it was given, replay both later, and get the same execution back. If
// the replay diverges even slightly the profile describes a run that never
// happened. Two things have to hold, and neither is documented:
//
//   1. The same state plus the same input really does reproduce the same run.
//   2. Installing an execute callback does not itself change the result.
//   3. The replay happens on the *same* simulation the recording came from.
//      Not a design preference but a requirement: a state restored into a
//      different simulation executes differently, because the core keeps a
//      copy of the cartridge pointer that `vbSetCartROM` does not reach, and
//      the stale one reads through a buffer belonging elsewhere. Measured —
//      restoring into the source simulation reproduces the run exactly,
//      restoring into a fresh one diverges within a few frames.
//
// Both are checked by comparing the *instruction streams* — every program
// counter, in order — rather than the machine's bytes. Byte equality is the
// wrong test and fails for an uninteresting reason: the state struct holds
// absolute pointers into the core's heap (the cartridge, the sample buffer),
// so two simulations running identically still differ wherever a pointer is
// stored. The execution is what a profile is about, and it is what this
// compares.
//
// Usage: node tests/emulator/replay-probe.mjs [path/to/output.vb]
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';

const TABLE_SLOTS = 16;
/** What the drive loop emulates per chunk: VB_CLOCK_RATE / VB_FRAME_RATE. */
const CLOCKS_PER_CHUNK = 20000000 / 50;
/** Long enough for a real game to get through boot and into its first frames. */
const CHUNKS = 120;

const repoRoot = new URL('../../', import.meta.url).pathname;
const corePath = path.join(
    repoRoot,
    'applications/electron/binaries/vuengine-studio-tools/web/shrooms-vb-core/core.wasm'
);
const romPath = process.argv[2] ?? '/Users/chris/dev/vb/projects/formula-v/build/output.vb';

if (!fs.existsSync(romPath)) {
    console.log(`skipped: no ROM at ${romPath}`);
    process.exit(0);
}

const { decodeRomKinds, VesProfileCollector } = await import(pathToFileURL(path.join(
    repoRoot,
    'extensions/vuengine-studio-extension/lib/emulator/common/ves-emulator-profile.js'
)).href);

let failures = 0;
const check = (label, actual, expected) => {
    const ok = Object.is(actual, expected);
    if (!ok) {
        failures++;
    }
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : `: got ${actual}, expected ${expected}`}`);
};
const report = (label, value) => console.log(`  --   ${label}: ${value}`);

// --- Core setup (see write-callback-probe.mjs for the table patch) ----------

function readUleb(bytes, at) {
    let result = 0, shift = 0, length = 0, byte;
    do {
        byte = bytes[at + length];
        result |= (byte & 0x7f) << shift;
        shift += 7;
        length++;
    } while (byte & 0x80);
    return [result, length];
}

function patchTableLimit(bytes, slots) {
    let position = 8;
    while (position < bytes.length) {
        const id = bytes[position];
        const [size, sizeLength] = readUleb(bytes, position + 1);
        const start = position + 1 + sizeLength;
        if (id === 4) {
            let at = start;
            const [, countLength] = readUleb(bytes, at);
            at += countLength + 1;
            const flag = bytes[at];
            at++;
            bytes[at] = slots;
            if (flag === 1) {
                bytes[at + 1] = slots;
            }
            return bytes;
        }
        position = start + size;
    }
    throw new Error('No table section found');
}

function uleb(value) {
    const out = [];
    do {
        let byte = value & 0x7f;
        value >>>= 7;
        if (value !== 0) {
            byte |= 0x80;
        }
        out.push(byte);
    } while (value !== 0);
    return out;
}

const section = (id, payload) => [id, ...uleb(payload.length), ...payload];
const vec = items => [...uleb(items.length), ...items.flat()];

function makeTrampoline(onCall, arity) {
    const I32 = 0x7f;
    const type = [0x60, ...vec(Array.from({ length: arity }, () => [I32])), ...vec([[I32]])];
    const body = [];
    for (let i = 0; i < arity; i++) {
        body.push(0x20, ...uleb(i));
    }
    body.push(0x10, 0x00, 0x0b);
    const bytes = Uint8Array.from([
        0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
        ...section(1, vec([type])),
        ...section(2, vec([[0x01, 0x65, 0x01, 0x66, 0x00, 0x00]])),
        ...section(3, vec([[0x00]])),
        ...section(7, vec([[0x01, 0x74, 0x00, 0x01]])),
        ...section(10, vec([[...uleb(body.length + 1), 0x00, ...body]])),
    ]);
    return new WebAssembly.Instance(new WebAssembly.Module(bytes), { e: { f: onCall } }).exports.t;
}

const ROM = new Uint8Array(fs.readFileSync(romPath));
report('rom', `${(ROM.byteLength / 1e6).toFixed(1)} MB`);

const { instance } = await WebAssembly.instantiate(
    patchTableLimit(fs.readFileSync(corePath), TABLE_SLOTS),
    { env: { emscripten_notify_memory_growth: () => { } } }
);
const E = instance.exports;
E._initialize();

const STATE_SIZE = E.vbSizeOf();
report('state size', `${STATE_SIZE.toLocaleString()} bytes`);

function newSim() {
    const romPointer = E.Realloc(0, ROM.byteLength);
    new Uint8Array(E.memory.buffer, romPointer, ROM.byteLength).set(ROM);
    const pointer = E.Realloc(0, STATE_SIZE);
    E.vbInit(pointer);
    E.vbSetCartROM(pointer, romPointer, ROM.byteLength);
    E.vbReset(pointer);
    return { pointer, romPointer, samples: E.GetExtSamples(pointer) };
}

const snapshot = sim => new Uint8Array(E.memory.buffer, sim.pointer, STATE_SIZE).slice();

/** One chunk, driven the way the worker's drive loop drives it. */
const sims = E.Realloc(0, 4);
const clocks = E.Realloc(0, 4);
function runChunk(sim) {
    new Uint32Array(E.memory.buffer, sims, 1)[0] = sim.pointer;
    // 5 = F32; the drive loop rewinds the sample cursor every chunk.
    E.vbSetSamples(sim.pointer, sim.samples, 5, 20000000 / 50 / 500);
    new Uint32Array(E.memory.buffer, clocks, 1)[0] = CLOCKS_PER_CHUNK;
    while (new Uint32Array(E.memory.buffer, clocks, 1)[0] !== 0) {
        E.Emulate(sims, 1, clocks);
    }
}

/** A scripted input sequence, so the recording has something to reproduce. */
const SCRIPT = new Map([[0, 0], [20, 0x0004], [40, 0x0204], [55, 0], [80, 0x0800]]);

/**
 * A cheap order-sensitive digest of every program counter seen.
 *
 * Keeping the whole stream would be tens of millions of entries; this collapses
 * it to two numbers that any reordering, omission or divergence changes.
 */
function makeStream() {
    let hash = 0x811c9dc5;
    let count = 0;
    return {
        push(address) {
            hash ^= address >>> 0;
            hash = Math.imul(hash, 0x01000193) >>> 0;
            count++;
        },
        get digest() {
            return `${count.toString(36)}:${hash.toString(16)}`;
        },
        get count() {
            return count;
        },
    };
}

/** Install a no-op execute callback that only records the stream. */
function watchStream(pointer, slot) {
    const stream = makeStream();
    instance.exports.__indirect_function_table.set(slot, makeTrampoline((unused, address) => {
        stream.push(address);
        return 0;
    }, 4));
    E.vbSetExecuteCallback(pointer, slot);
    return stream;
}

// --- 1. Record ---------------------------------------------------------------

console.log('\n1. Recording a session');
const recording = { state: null, chunks: 0, keys: [] };
let originalStream;
let recordedSim;
{
    const sim = recordedSim = newSim();
    // Let it boot before recording starts, so the recording begins mid-run —
    // which is the realistic case and the one that exercises a mid-call start.
    for (let chunk = 0; chunk < 10; chunk++) {
        runChunk(sim);
    }

    recording.state = snapshot(sim).buffer;
    // Watched from here on, so the original run's execution can be compared
    // against the replay's. The recording itself does not need this — it is
    // only the yardstick.
    originalStream = watchStream(sim.pointer, 2);
    let mask = 0;
    let last = 0;
    recording.keys.push([0, 0]);
    for (let chunk = 0; chunk < CHUNKS; chunk++) {
        const scripted = SCRIPT.get(chunk);
        if (scripted !== undefined) {
            mask = scripted;
            E.vbSetKeys(sim.pointer, mask);
        }
        if (mask !== last) {
            recording.keys.push([chunk, mask]);
            last = mask;
        }
        recording.chunks++;
        runChunk(sim);
    }
    E.vbSetExecuteCallback(sim.pointer, 0);
    report('chunks recorded', `${recording.chunks} (${(recording.chunks / 50).toFixed(1)} s of play)`);
    report('key changes stored', recording.keys.length);
    report('recording size',
        `${(recording.state.byteLength + recording.keys.length * 8).toLocaleString()} bytes`);
}

// --- 2. Replay ---------------------------------------------------------------

console.log('\n2. Replaying it with an execute callback');
let replayStream;
let collector;
{
    // The same simulation, borrowed back — see the note at the top of this
    // file for why a fresh one will not do.
    const sim = recordedSim;
    const kinds = decodeRomKinds(ROM);
    const mask = ROM.byteLength - 1;
    const powerOfTwo = (ROM.byteLength & mask) === 0;
    collector = new VesProfileCollector();

    replayStream = makeStream();
    instance.exports.__indirect_function_table.set(1, makeTrampoline((unused, address) => {
        replayStream.push(address);
        const offset = powerOfTwo
            ? (address >>> 0) & mask
            : ((address >>> 0) & 0x00ffffff) % ROM.byteLength;
        collector.push(address >>> 0, kinds[offset >> 1]);
        return 0;
    }, 4));

    new Uint8Array(E.memory.buffer, sim.pointer, STATE_SIZE).set(new Uint8Array(recording.state));
    E.vbSetCartROM(sim.pointer, sim.romPointer, ROM.byteLength);
    E.vbSetSamples(sim.pointer, sim.samples, 5, 20000000 / 50 / 500);
    E.vbSetExecuteCallback(sim.pointer, 1);

    const keys = new Map(recording.keys);
    const started = process.hrtime.bigint();
    for (let chunk = 0; chunk < recording.chunks; chunk++) {
        const pressed = keys.get(chunk);
        if (pressed !== undefined) {
            E.vbSetKeys(sim.pointer, pressed);
        }
        runChunk(sim);
    }
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    E.vbSetExecuteCallback(sim.pointer, 0);

    const recorded = (recording.chunks / 50) * 1000;
    report('replay', `${ms.toFixed(0)} ms for ${recorded.toFixed(0)} ms of play `
        + `(${(ms / recorded).toFixed(2)}x real time)`);
}

// --- 3. Did it reproduce the session? ---------------------------------------

console.log('\n3. Comparing the two runs');
{
    report('original instructions', originalStream.count.toLocaleString());
    report('replayed instructions', replayStream.count.toLocaleString());
    report('original digest', originalStream.digest);
    report('replayed digest', replayStream.digest);

    check('the replay executed the same number of instructions',
        replayStream.count, originalStream.count);
    // The whole export rests on this: same state, same input, same execution —
    // and an execute callback that observes without disturbing, since the
    // recording ran with a different one installed.
    check('the replay executed the same instructions in the same order',
        replayStream.digest, originalStream.digest);
}

// --- 4. What the replay collected -------------------------------------------

console.log('\n4. The profile it produced');
{
    const nodes = collector.finish();
    const named = nodes.filter(node => node.address >= 0);
    report('instructions', collector.sampleCount.toLocaleString());
    report('call tree nodes', nodes.length.toLocaleString());
    report('depth overflows', collector.overflows);
    report('machine resets during the recording', collector.resetCount);

    check('it executed something', collector.sampleCount > 0, true);
    check('it found a call tree', named.length > 0, true);
    check('self time sums to the instructions executed',
        nodes.reduce((total, node) => total + node.selfSamples, 0), collector.sampleCount);
    check('the root accounts for everything', nodes[0].totalSamples, collector.sampleCount);
    check('nothing ran away', collector.overflows, 0);

    const busiest = [...named].sort((a, b) => b.selfSamples - a.selfSamples).slice(0, 5);
    for (const node of busiest) {
        report('hot frame',
            `0x${(node.address >>> 0).toString(16).toUpperCase()} `
            + `self ${node.selfSamples.toLocaleString()} total ${node.totalSamples.toLocaleString()}`);
    }
}

// --- 5. The exported file ----------------------------------------------------

console.log('\n5. Writing a Firefox Profiler file');
{
    const { toFirefoxProfile } = await import(pathToFileURL(path.join(
        repoRoot,
        'extensions/vuengine-studio-extension/lib/emulator/common/ves-emulator-profile.js'
    )).href);
    const { readElf } = await import(pathToFileURL(path.join(
        repoRoot,
        'extensions/vuengine-studio-extension/lib/emulator/browser/core/ves-emulator-elf.js'
    )).href);
    const { indexElfSymbols, findFunctionAt, functionDisplayName } = await import(pathToFileURL(path.join(
        repoRoot,
        'extensions/vuengine-studio-extension/lib/emulator/browser/core/ves-emulator-symbols.js'
    )).href);

    const elfPath = path.join(path.dirname(romPath), 'working/output-release.elf');
    const index = fs.existsSync(elfPath)
        ? indexElfSymbols(readElf(new Uint8Array(fs.readFileSync(elfPath))))
        : undefined;
    report('symbols', index ? `${index.codeSymbols.length.toLocaleString()} functions` : 'none, addresses only');

    const nodes = collector.finish();
    let named = 0;
    const profile = toFirefoxProfile(nodes, address => {
        const symbol = index && findFunctionAt(index, address, ROM.byteLength);
        if (symbol) {
            named++;
            return { name: functionDisplayName(index, symbol.name) };
        }
        return { name: `0x${(address >>> 0).toString(16).toUpperCase()}` };
    }, 'formula-v');

    const json = JSON.stringify(profile);
    // Into the system temp directory, not the repository: this is a sample to
    // drop on profiler.firefox.com, not something to keep.
    const out = path.join(os.tmpdir(), 'ves-profile-sample.json');
    fs.writeFileSync(out, json);
    report('written', `${out} (${(json.length / 1e6).toFixed(2)} MB)`);
    report('frames named', `${named} of ${nodes.length}`);

    check('most frames resolved to a function', named > nodes.length / 2, true);
    check('the file parses back', JSON.parse(json).threads.length, 1);
    check('it is titled after the game', profile.meta.product, 'formula-v');

    const table = profile.threads[0].funcTable;
    const strings = profile.threads[0].stringArray;
    const shown = [...new Set(table.name.map(i => strings[i]))].filter(n => !n.startsWith('0x'));
    report('sample of what it names', shown.slice(0, 6).join(', '));
    check('names read as the source does', shown.some(n => n.includes('::')), true);
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nall checks passed');
process.exit(failures ? 1 : 0);
