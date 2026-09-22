/**
 * Exercises the routing in VesFileOpenElectronMainApplication: which OS-supplied
 * paths become workspaces, which are handed to a frontend, and in what order.
 *
 * Runs the compiled class from `lib/` with the Electron-facing parts stubbed, so
 * the decisions it makes can be checked without launching the application.
 * Usage: node extensions/vuengine-studio-extension/tests/open-file-routing-probe.mjs
 */
import { mkdtempSync, mkdirSync, writeFileSync, realpathSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { realpath } from 'fs/promises';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { VesFileOpenElectronMainApplication } =
    require('../lib/core/electron-main/ves-file-open-electron-main-application');

// Resolved, because the paths the application reports are: on macOS the temporary
// directory is a symlink, and a file named on the command line is realpath'd.
const root = realpathSync(mkdtempSync(join(tmpdir(), 'ves-open-file-')));
const rom = join(root, 'output.vb');
const actor = join(root, 'Hero.actor');
const workspaceFile = join(root, 'MyGame.workspace');
const folder = join(root, 'MyProject');
writeFileSync(rom, '');
writeFileSync(actor, '');
writeFileSync(workspaceFile, '');
mkdirSync(folder);
const missing = join(root, 'does-not-exist.vb');

let failures = 0;
/** The `show` that follows every delivery is noise in the routing checks. */
function withoutShow(log) {
    return log.filter(entry => entry !== 'show');
}

function check(name, actual, expected) {
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    if (a === e) {
        console.log(`  ok    ${name}`);
    } else {
        failures++;
        console.log(`  FAIL  ${name}\n          expected ${e}\n          actual   ${a}`);
    }
}

/** An instance with no constructor run and every outward call recorded. */
function newApp({ ready = true, windows = 1 } = {}) {
    const app = Object.create(VesFileOpenElectronMainApplication.prototype);
    const log = [];
    app.queuedFiles = [];
    app.readyWindows = new Set();
    app.startupFinished = false;
    app.flushingQueue = false;
    app.frontendReady = { promise: ready ? Promise.resolve() : new Promise(() => { }) };
    app.windows = new Map();
    const makeWindow = id => ({
        openUrl: async url => { log.push(`frontend:${url}`); return undefined; },
        window: { isMinimized: () => false, restore() { }, show() { log.push('show'); }, focus() { } },
    });
    for (let i = 0; i < windows; i++) {
        app.windows.set(i, makeWindow(i));
        if (ready) { app.readyWindows.add(i); }
    }
    app.activeWindowStack = [...app.windows.keys()];
    app.makeWindow = makeWindow;
    app.openWindowWithWorkspace = async workspacePath => {
        log.push(`workspace:${workspacePath === '' ? '<previous>' : workspacePath}`);
        app.windows.set(99, app.makeWindow(99));
        app.activeWindowStack.push(99);
        app.readyWindows.add(99);
    };
    app.openDefaultWindow = async () => {
        log.push('defaultWindow');
        app.windows.set(99, app.makeWindow(99));
        app.activeWindowStack.push(99);
        app.readyWindows.add(99);
    };
    app.log = log;
    return app;
}

/** Waits for the queue, which `handleMainCommand` deliberately does not await. */
async function drain(app) {
    for (let waited = 0; waited < 10000; waited += 10) {
        if (!app.flushingQueue && app.queuedFiles.length === 0) {
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error('the queue never drained');
}

/**
 * Calls the overridden handleMainCommand with the base class it delegates to replaced by a
 * faithful copy of Theia's — same resolution, same fallbacks — that records rather than opens.
 */
async function handleMainCommand(app, options) {
    const base = Object.getPrototypeOf(VesFileOpenElectronMainApplication.prototype);
    const originalBase = base.handleMainCommand;
    base.handleMainCommand = async function (opts) {
        let workspacePath;
        if (opts.file) {
            try {
                workspacePath = await realpath(resolve(opts.cwd, opts.file));
            } catch {
                this.log.push('error:unresolvable');
            }
        }
        if (workspacePath !== undefined) {
            await this.openWindowWithWorkspace(workspacePath);
        } else if (opts.secondInstance === false) {
            await this.openWindowWithWorkspace('');
        } else if (opts.file === undefined) {
            await this.openDefaultWindow();
        }
    };
    try {
        await VesFileOpenElectronMainApplication.prototype.handleMainCommand.call(app, options);
        await drain(app);
    } finally {
        base.handleMainCommand = originalBase;
    }
}

console.log('isWorkspace');
{
    const app = newApp();
    const is = p => VesFileOpenElectronMainApplication.prototype.isWorkspace.call(app, p);
    check('.workspace file', await is(workspaceFile), true);
    check('.WORKSPACE file, upper case', await is(workspaceFile.replace('.workspace', '.WORKSPACE')), true);
    check('directory', await is(folder), true);
    check('.theia-workspace file', await is(join(root, 'x.theia-workspace')), true);
    check('.vb ROM', await is(rom), false);
    check('.actor', await is(actor), false);
    check('missing path', await is(missing), false);
}

console.log('cold launch');
{
    // macOS: Finder "Open With" on a ROM, no command line file.
    const app = newApp();
    await app.handleOpenFile(rom);
    check('nothing happens before the startup command', withoutShow(app.log), []);
    await handleMainCommand(app, { file: undefined, cwd: root, secondInstance: false });
    check('restores the previous workspace, then opens the ROM',
        withoutShow(app.log), ['workspace:<previous>', `frontend:file://${rom}`]);
}
{
    // macOS: Finder on a workspace file — that is the workspace to open.
    const app = newApp();
    await app.handleOpenFile(workspaceFile);
    await handleMainCommand(app, { file: undefined, cwd: root, secondInstance: false });
    check('opens the workspace itself, not the previous one', withoutShow(app.log), [`workspace:${workspaceFile}`]);
}
{
    // macOS: several files at once, one of them a workspace.
    const app = newApp();
    await app.handleOpenFile(rom);
    await app.handleOpenFile(workspaceFile);
    await app.handleOpenFile(actor);
    await handleMainCommand(app, { file: undefined, cwd: root, secondInstance: false });
    check('the workspace opens, the documents follow in order',
        withoutShow(app.log), [`workspace:${workspaceFile}`, `frontend:file://${rom}`, `frontend:file://${actor}`]);
}
{
    // Command line: vuengine-studio output.vb
    const app = newApp();
    await handleMainCommand(app, { file: 'output.vb', cwd: root, secondInstance: false });
    check('a ROM on the command line is a document, not a workspace',
        withoutShow(app.log), ['workspace:<previous>', `frontend:file://${rom}`]);
}
{
    const app = newApp();
    await handleMainCommand(app, { file: 'MyProject', cwd: root, secondInstance: false });
    check('a folder on the command line still opens as a workspace', withoutShow(app.log), [`workspace:${folder}`]);
}
{
    const app = newApp();
    await handleMainCommand(app, { file: 'does-not-exist.vb', cwd: root, secondInstance: false });
    check('an unresolvable path is left to the base implementation, which says so',
        withoutShow(app.log), ['error:unresolvable', 'workspace:<previous>']);
}
{
    const app = newApp();
    await handleMainCommand(app, { file: undefined, cwd: root, secondInstance: false });
    check('no file at all is unchanged', withoutShow(app.log), ['workspace:<previous>']);
}

console.log('while running');
{
    const app = newApp();
    app.startupFinished = true;
    await app.handleOpenFile(rom);
    check('a document goes straight to the frontend', withoutShow(app.log), [`frontend:file://${rom}`]);
}
{
    const app = newApp();
    app.startupFinished = true;
    await app.handleOpenFile(folder);
    check('a folder opens a window of its own', withoutShow(app.log), [`workspace:${folder}`]);
}
{
    // macOS keeps the application alive with every window closed.
    const app = newApp({ windows: 0 });
    app.startupFinished = true;
    await app.handleOpenFile(rom);
    check('with no windows left, one is opened first',
        withoutShow(app.log), ['workspace:<previous>', `frontend:file://${rom}`]);
}
{
    // A second instance from the command line must not open an empty extra window.
    const app = newApp();
    await handleMainCommand(app, { file: 'output.vb', cwd: root, secondInstance: true });
    check('a second instance hands the ROM to the running window', withoutShow(app.log), [`frontend:file://${rom}`]);
}
{
    const app = newApp({ windows: 0 });
    await handleMainCommand(app, { file: 'output.vb', cwd: root, secondInstance: true });
    check('a second instance with no window open makes one', withoutShow(app.log), ['defaultWindow', `frontend:file://${rom}`]);
}

console.log('delivery');
{
    // The frontend's reply cannot be trusted, so a file goes to exactly one window —
    // the most recently focused one that is ready — and never to the others.
    const app = newApp({ windows: 3 });
    app.startupFinished = true;
    app.activeWindowStack = [2, 0, 1];
    await app.handleOpenFile(rom);
    check('offered to one window only', app.log.filter(entry => entry.startsWith('frontend:')).length, 1);
    check('and the application is brought forward', app.log.includes('show'), true);
}
{
    // A window whose frontend has not started yet must not be handed the file.
    const app = newApp({ windows: 2 });
    app.startupFinished = true;
    app.readyWindows.clear();
    app.readyWindows.add(1);
    app.activeWindowStack = [0, 1];
    await app.handleOpenFile(rom);
    check('skips a window that is not ready', app.log.filter(entry => entry.startsWith('frontend:')).length, 1);
}
{
    // One bad file must not strand the ones behind it.
    const app = newApp();
    app.startupFinished = true;
    app.openWindowWithWorkspace = async () => { throw new Error('boom'); };
    app.queuedFiles.push(folder, rom);
    await app.flushQueuedFiles();
    check('the queue survives a failure', app.log.filter(entry => entry.startsWith('frontend:')), [`frontend:file://${rom}`]);
}

console.log('backend command line');
{
    // The backend is forked with the command line and would take the ROM as its workspace.
    const base = Object.getPrototypeOf(VesFileOpenElectronMainApplication.prototype);
    const originalStart = base.startBackend;
    const run = async argv => {
        const app = newApp();
        app.processArgv = { getProcessArgvWithoutBin: (a = process.argv) => a.slice(2) };
        let seen;
        base.startBackend = async function () {
            seen = [...process.argv];
            return 3000;
        };
        const original = [...process.argv];
        process.argv = ['electron', 'main.js', ...argv];
        try {
            await VesFileOpenElectronMainApplication.prototype.startBackend.call(app);
            return { seen: seen.slice(2), after: process.argv.slice(2) };
        } finally {
            process.argv = original;
            base.startBackend = originalStart;
        }
    };

    let result = await run(['--plugins=local-dir:x', rom]);
    check('a ROM is kept from the backend', result.seen, ['--plugins=local-dir:x']);
    check('and put back afterwards', result.after, ['--plugins=local-dir:x', rom]);

    result = await run([folder]);
    check('a workspace folder still reaches the backend', result.seen, [folder]);

    result = await run([workspaceFile]);
    check('a workspace file still reaches the backend', result.seen, [workspaceFile]);

    result = await run([]);
    check('nothing to strip', result.seen, []);

    result = await run(['--electronUserData', folder, rom]);
    check('an option value is not mistaken for the file',
        result.seen, ['--electronUserData', folder]);
}

console.log(failures === 0 ? '\nall checks passed' : `\n${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
