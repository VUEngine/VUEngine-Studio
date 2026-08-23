// Does the line table index read a real build, and do its paths open?
//
// Phase 5 needs two things from `.debug_line`: a line to put a breakpoint at,
// and an address to name in a stack frame. Rather than interpret the section's
// bytecode this parses what `v810-objdump --dwarf=decodedline` prints, so this
// probe checks the parse against a real ELF — and, more importantly, checks the
// path mapping, because DWARF names the preprocessor's generated file rather
// than the source anyone edits.
//
// Usage: node tests/emulator/line-table-probe.mjs [path/to/output.elf]
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const DEFAULT_ELF = '/Users/chris/dev/vb/projects/formula-v/build/working/output-release.elf';
const elfPath = process.argv[2] ?? DEFAULT_ELF;

const repoRoot = new URL('../../', import.meta.url).pathname;
const engineHome = path.join(repoRoot, 'applications/electron/vb/vuengine');

/** The toolchain ships one of these per platform. */
function findObjdump() {
    const bin = path.join(repoRoot, 'applications/electron/binaries/vuengine-studio-tools');
    for (const platform of ['osx-arm64', 'osx-x64', 'linux', 'win']) {
        const candidate = path.join(bin, platform, 'gcc/bin/v810-objdump');
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }
    return undefined;
}

if (!fs.existsSync(elfPath)) {
    console.log(`skipped: no ELF at ${elfPath}`);
    console.log('  (build a project, or pass one: node tests/emulator/line-table-probe.mjs <elf>)');
    process.exit(0);
}
const objdump = findObjdump();
if (!objdump) {
    console.log('skipped: no v810-objdump in the shipped toolchain');
    process.exit(0);
}

const { parseDecodedLineTable, makeSourcePathMapper, romOffsetOf, needsSourcePathMapping } =
    await import(pathToFileURL(path.join(
        repoRoot,
        'extensions/vuengine-studio-extension/lib/emulator/browser/core/ves-emulator-line-table.js'
    )).href);

let failures = 0;
const check = (label, ok, extra = '') => {
    if (!ok) {
        failures++;
    }
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${extra ? ` — ${extra}` : ''}`);
};
const report = (label, value) => console.log(`  --   ${label}: ${value}`);

// --- Read the table ---------------------------------------------------------

const started = Date.now();
const text = execFileSync(objdump, ['--dwarf=decodedline', elfPath], {
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
});
report('objdump', `${(text.length / 1e6).toFixed(1)} MB in ${Date.now() - started} ms`);

// The ROM the ELF was built into, for keying rows by offset. Its size is what
// the cartridge mirrors at, so it decides how a program counter maps back.
const romPath = path.join(path.dirname(elfPath), '../output.vb');
const romSize = fs.existsSync(romPath) ? fs.statSync(romPath).size : 0;
report('rom size', romSize ? `${romSize} bytes` : 'unknown, offsets unmirrored');

check('a build without #line needs path mapping', needsSourcePathMapping(text), true);

const projectRoot = path.resolve(path.dirname(elfPath), '../..');
const mapper = makeSourcePathMapper([
    { name: path.basename(projectRoot), root: projectRoot },
    { name: 'core', root: path.join(engineHome, 'core') },
    { name: 'platforms', root: path.join(engineHome, 'platforms') },
    // `vuengine` is how the build names the bundled plugin folder, and the
    // double slash in `vuengine//actors/...` is the build's own — see
    // config.make, which lists plugins that way.
    { name: 'vuengine', root: path.join(engineHome, 'plugins') },
]);

const parsed = Date.now();
const table = parseDecodedLineTable(text, romSize, mapper);
report('parsed', `${table.entries.length.toLocaleString()} rows, ${table.files.length} files, ${Date.now() - parsed} ms`);
check('the table has rows', table.entries.length > 0, true);
check('rows are ordered by address',
    table.entries.every((entry, at) => at === 0 || table.entries[at - 1].offset <= entry.offset), true);

// --- Do the mapped paths open? ----------------------------------------------

// Three groups, and only the first is this probe's business:
//   - rewritten to a real source root, which must open;
//   - still under build/working, meaning no root was supplied for that
//     component (`user`, the user plugin folder, is configured per install and
//     is not knowable from here);
//   - neither, which is libc compiled into the toolchain, carrying its own
//     relative paths and not on this machine at all.
const claimed = table.files.filter(file => !file.includes('build/working')
    && (file.startsWith(projectRoot) || file.startsWith(engineHome)));
const unmapped = table.files.filter(file => file.includes('build/working'));
const missing = claimed.filter(file => !fs.existsSync(file));
report('rewritten to a source root', `${claimed.length} of ${table.files.length}`);
report('left under build/working', `${unmapped.length} (no root given for their component)`);
for (const file of unmapped.slice(0, 3)) {
    report('  no root for', file.replace(/^.*build\/working\//, 'build/working/'));
}
for (const file of missing.slice(0, 5)) {
    report('unresolved', file);
}
// The generated per-component `<name>SetupClasses.c` has no original to point
// at, by design — everything else must open.
const unexplained = missing.filter(file => !/SetupClasses\.c$/.test(file));
check('every mapped source exists on disk, bar the generated ones',
    unexplained.length === 0, `${missing.length} missing, ${unexplained.length} unexplained`);
check('no rewritten path is left with a doubled slash',
    claimed.every(file => !file.slice(1).includes('//')), true);

// --- Both directions --------------------------------------------------------

const sample = table.entries[Math.floor(table.entries.length / 2)];
const back = table.locate(sample.offset);
check('an address locates to a line', !!back,
    back ? `${path.basename(back.file)}:${back.line}` : '');
check('it locates to the row it came from', back?.offset === sample.offset, true);

const forward = table.resolve(sample.file, sample.line);
check('that line resolves back to an address', !!forward,
    forward ? `0x${forward.offset.toString(16)}` : '');

// Round-trip a spread of rows rather than one.
let stable = 0;
for (let at = 0; at < table.entries.length; at += Math.max(1, Math.floor(table.entries.length / 200))) {
    const entry = table.entries[at];
    if (table.locate(entry.offset)?.offset === entry.offset) {
        stable++;
    }
}
check('sampled addresses all locate to themselves', stable > 0, `${stable} sampled`);

// The mirror the program counter actually runs in — see romOffsetOf.
if (romSize > 0) {
    const inWindow = (0x07000000 + sample.offset) >>> 0;
    const inMirror = (0xff000000 | sample.offset) >>> 0;
    check('the ROM window and the top-of-memory mirror agree',
        romOffsetOf(inWindow, romSize) === romOffsetOf(inMirror, romSize),
        `0x${romOffsetOf(inWindow, romSize).toString(16)}`);
}

check('an unknown file resolves to nothing', table.resolve('/nowhere.c', 1) === undefined, true);
check('a line far past the end resolves to nothing',
    table.resolve(sample.file, 999999) === undefined, true);

console.log(failures ? `\n${failures} FAILURE(S)` : '\nall checks passed');
process.exit(failures ? 1 : 0);
