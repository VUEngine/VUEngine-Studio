// Does the collector build the call tree a known instruction stream implies,
// and is what it exports structurally sound?
//
// callstack-probe.mjs established that calls and returns are recognisable and
// cheap to follow. This checks the layer above: that following them produces
// the right tree, that self and total time add up, and that the Firefox
// Profiler conversion produces tables whose indices all point somewhere.
//
// It also decodes a real ROM, because the instruction kinds are the one input
// the collector cannot sanity-check for itself.
//
// Usage: node tests/emulator/profile-probe.mjs [path/to/output.vb]
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const repoRoot = new URL('../../', import.meta.url).pathname;
const {
    decodeRomKinds,
    VesProfileCollector,
    toFirefoxProfile,
} = await import(pathToFileURL(path.join(
    repoRoot,
    'extensions/vuengine-studio-extension/lib/emulator/common/ves-emulator-profile.js'
)).href);

const OTHER = 0;
const CALL = 1;
const RETURN = 2;

let failures = 0;
const check = (label, actual, expected) => {
    const ok = Object.is(actual, expected);
    if (!ok) {
        failures++;
    }
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : `: got ${actual}, expected ${expected}`}`);
};
const report = (label, value) => console.log(`  --   ${label}: ${value}`);

// --- 1. A known call tree ---------------------------------------------------

console.log('1. Building a tree from a known stream');
{
    // Addresses matter now: a frame is entered at whatever the instruction
    // after a call is, and closed by arriving back at the call's own return
    // address. So the stream has to be a plausible walk through memory.
    //
    //   main at 0x100 runs, calls a; a runs, calls b; b returns; a returns;
    //   main calls a a second time, which must land on the *same* node.
    const collector = new VesProfileCollector();
    const stream = [
        [0x100, OTHER], [0x104, OTHER], [0x108, CALL],
        [0x200, OTHER], [0x204, OTHER], [0x208, OTHER], [0x20c, CALL],
        [0x300, OTHER], [0x304, RETURN],
        [0x210, OTHER], [0x214, RETURN],          // back in a, then out of it
        [0x10c, OTHER], [0x110, CALL],            // back in main, calls a again
        [0x200, OTHER], [0x204, RETURN],
        [0x114, OTHER],                           // back in main
    ];
    for (const [address, kind] of stream) {
        collector.push(address, kind);
    }

    const nodes = collector.finish();
    const root = nodes[0];
    const a = nodes.find(node => node.address === 0x200);
    const b = nodes.find(node => node.address === 0x300);

    check('a node exists per distinct call target', nodes.length, 3);
    check('the second call reuses the first call\'s node',
        nodes.filter(node => node.address === 0x200).length, 1);
    check('b hangs off a, not off the root', b.parent, a.id);

    // Charged where they ran: a call belongs to the caller, since it is the
    // caller executing it.
    check('root self time', root.selfSamples, 6);
    check('a self time', a.selfSamples, 8);
    check('b self time', b.selfSamples, 2);
    check('total time rolls up', root.totalSamples, collector.sampleCount);
    check('a total includes b', a.totalSamples, a.selfSamples + b.totalSamples);
    check('every instruction is accounted for once', root.totalSamples, stream.length);
}

// --- 2. Returns that do not look like returns -------------------------------

console.log('\n2. A frame that leaves some other way');
{
    // The case that made the address model necessary: a callee that returns
    // through something other than JMP [r31] — a jump on a saved register, a
    // reti, a tail call. Arriving at the return address is what closes it.
    const collector = new VesProfileCollector();
    for (const [address, kind] of [
        [0x100, OTHER], [0x104, CALL],
        [0x200, OTHER], [0x204, OTHER],   // no RETURN anywhere in the callee
        [0x108, OTHER],                   // but execution comes back regardless
        [0x10c, OTHER],
    ]) {
        collector.push(address, kind);
    }
    const nodes = collector.finish();
    check('the frame was entered', nodes.length, 2);
    check('and closed without a return instruction', nodes[0].selfSamples, 4);
    check('the callee kept only its own', nodes[1].selfSamples, 2);
    check('nothing was left on the stack', collector.overflows, 0);
}

// --- 3. A runaway stack ------------------------------------------------------

console.log('\n3. A stack that never returns');
{
    // Every instruction a call to the next address, so nothing ever arrives at
    // a return address and the stack only grows.
    const collector = new VesProfileCollector();
    for (let at = 0; at < 1000; at++) {
        collector.push(0x1000 + at * 8, CALL);
    }
    collector.finish();
    check('depth is capped rather than unbounded', collector.overflows > 0, true);
    check('every instruction is still charged', collector.sampleCount, 1000);
}

// --- 4. The Firefox Profiler conversion --------------------------------------

console.log('\n4. Converting for Firefox Profiler');
{
    const collector = new VesProfileCollector();
    for (const [address, kind] of [
        [0x100, CALL], [0x200, OTHER], [0x204, CALL],
        [0x300, OTHER], [0x208, OTHER], [0x104, OTHER],
    ]) {
        collector.push(address, kind);
    }
    const nodes = collector.finish();

    const profile = toFirefoxProfile(nodes, address => ({
        name: `func_${address.toString(16)}`,
        file: '/src/Thing.c',
        line: 40 + (address & 0xff),
    }), 'Test Game');
    const thread = profile.threads[0];
    const { samples, stackTable, frameTable, funcTable, stringArray } = thread;

    report('nodes', nodes.length);
    report('samples', samples.length);
    report('funcs', funcTable.length);

    // Every table says how long it is; every parallel column must agree.
    const columnsAgree = (table, names) => names.every(name => table[name].length === table.length);
    check('stackTable columns agree with its length',
        columnsAgree(stackTable, ['frame', 'prefix', 'category', 'subcategory']), true);
    check('frameTable columns agree with its length',
        columnsAgree(frameTable, ['address', 'func', 'line', 'category']), true);
    check('funcTable columns agree with its length',
        columnsAgree(funcTable, ['name', 'fileName', 'lineNumber', 'isJS']), true);
    check('samples columns agree with its length',
        columnsAgree(samples, ['stack', 'time', 'weight']), true);

    // Every index points somewhere real.
    check('sample stacks are in range',
        samples.stack.every(index => index >= 0 && index < stackTable.length), true);
    check('stack frames are in range',
        stackTable.frame.every(index => index >= 0 && index < frameTable.length), true);
    check('stack prefixes are in range or null',
        stackTable.prefix.every(index => index === null || (index >= 0 && index < stackTable.length)), true);
    check('frame funcs are in range',
        frameTable.func.every(index => index >= 0 && index < funcTable.length), true);
    check('func names are in the string table',
        funcTable.name.every(index => index >= 0 && index < stringArray.length), true);

    // A prefix must come before its child, or the importer cannot walk it.
    check('every prefix precedes its stack',
        stackTable.prefix.every((prefix, at) => prefix === null || prefix < at), true);

    // The weights must still add up to what was collected.
    const weighed = samples.weight.reduce((total, weight) => total + weight, 0);
    check('sample weights total the instructions collected', weighed, collector.sampleCount);

    // Two things the importer is strict about, both learned the hard way.
    check('no sampleUnits without a threadCPUDelta column',
        !('sampleUnits' in profile.meta) || 'threadCPUDelta' in samples, true);
    check('sample times are not all the same instant',
        new Set(samples.time).size === samples.time.length, true);
    check('sample times only ever move forward',
        samples.time.every((at, index) => index === 0 || at > samples.time[index - 1]), true);

    // The title is what tells two captures apart, so it has to be the game's.
    check('the profile is titled after what was profiled', profile.meta.product, 'Test Game');

    check('it survives a JSON round trip',
        JSON.parse(JSON.stringify(profile)).threads[0].samples.length, samples.length);
}

// --- 5. Decoding a real ROM --------------------------------------------------

console.log('\n5. Decoding a real ROM');
{
    const romPath = process.argv[2] ?? '/Users/chris/dev/vb/projects/formula-v/build/output.vb';
    if (!fs.existsSync(romPath)) {
        console.log(`  --   skipped: no ROM at ${romPath}`);
    } else {
        const rom = new Uint8Array(fs.readFileSync(romPath));
        const started = process.hrtime.bigint();
        const kinds = decodeRomKinds(rom);
        const ms = Number(process.hrtime.bigint() - started) / 1e6;

        let calls = 0;
        let returns = 0;
        for (const kind of kinds) {
            if (kind === CALL) {
                calls++;
            } else if (kind === RETURN) {
                returns++;
            }
        }
        report('rom', `${(rom.byteLength / 1e6).toFixed(1)} MB decoded in ${ms.toFixed(1)} ms`);
        report('calls / returns', `${calls.toLocaleString()} / ${returns.toLocaleString()}`);
        check('the table covers every halfword', kinds.length, rom.byteLength >> 1);
        check('a real ROM has calls in it', calls > 0, true);
        check('and returns', returns > 0, true);
        // A ROM is mostly not code — data, assets and padding — so the two
        // kinds together should be a small share of it. A large share would
        // mean the opcode test is matching things that are not instructions.
        const share = (calls + returns) / kinds.length;
        report('share of halfwords that decode as call or return', `${(share * 100).toFixed(2)}%`);
        check('they are a minority of the ROM, as code in data should be', share < 0.1, true);
    }
}

console.log(failures ? `\n${failures} FAILURE(S)` : '\nall checks passed');
process.exit(failures ? 1 : 0);
