/**
 * This file can be edited to adjust the ESBuild build process.
 * To reset, delete this file and rerun theia build again.
 */
import { browserOptions, watch, __dirname } from './gen-esbuild.browser.mjs';
import { nodeOptions } from './gen-esbuild.node.mjs';
import { electronOptions } from './gen-esbuild.electron.mjs';
import esbuild from 'esbuild';
import path from 'path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/**
 * @jsdevtools/ono (pulled in via @apidevtools/json-schema-ref-parser) imports its
 * isomorphic implementation as the extensionless specifier "./isomorphic.node". Theia's
 * nativeDependenciesPlugin treats any import ending in ".node" as a native addon and
 * routes it through its runtime-require shim, which then fails to re-resolve the actual
 * "isomorphic.node.js" file. Resolve this specific import ourselves, ahead of Theia's
 * plugin, so it's bundled as the plain JS module it actually is.
 */
function onoIsomorphicFixPlugin() {
    return {
        name: 'ono-isomorphic-fix',
        setup(build) {
            build.onResolve({ filter: /^\.\/isomorphic\.node$/ }, args => {
                if (!/[\\/]@jsdevtools[\\/]ono[\\/]/.test(args.importer)) {
                    return;
                }
                return { path: path.join(path.dirname(args.importer), 'isomorphic.node.js') };
            });
        }
    };
}
nodeOptions.plugins.unshift(onoIsomorphicFixPlugin());

/**
 * @jsdevtools/ono's package.json puts "esm/index.js" in its "module" field, which our
 * `mainFields: ['node', 'module', 'main']` prefers. That file ends with a "CommonJS default
 * export hack" (`module.exports = Object.assign(module.exports.default, module.exports)`)
 * meant to run inside a real per-file CJS wrapper. esbuild bundles ESM sources via its
 * `__esm` helper instead, which does not provide a local `module`/`exports` closure, so the
 * hack falls through to the *entry bundle's own* `module` object and overwrites
 * electron-main.js's exports with `Object.assign(undefined, ...)`, crashing on startup.
 * The CJS build (`cjs/index.js`) has the same hack but esbuild wraps CJS sources with a
 * real isolated `module`/`exports`, where it's safe. Force resolution to that build.
 */
function onoCjsFixPlugin() {
    const cjsEntry = require.resolve('@jsdevtools/ono/cjs/index.js');
    return {
        name: 'ono-cjs-fix',
        setup(build) {
            build.onResolve({ filter: /^@jsdevtools\/ono$/ }, () => ({ path: cjsEntry }));
        }
    };
}
nodeOptions.plugins.unshift(onoCjsFixPlugin());

const shroomsPath = path.resolve(__dirname, 'binaries/vuengine-studio-tools/web/shrooms-vb-core');
browserOptions.entryPoints['shrooms.audio'] = shroomsPath + '/Audio.js';
browserOptions.entryPoints['shrooms.core'] = shroomsPath + '/Core.js';

const browserContext = await esbuild.context(browserOptions);
const nodeContext = await esbuild.context(nodeOptions);
const electronContext = await esbuild.context(electronOptions);

if (watch) {
    await Promise.all([
        browserContext.watch(),
        nodeContext.watch(),
        electronContext.watch(),
    ]);
} else {
    try {
        await browserContext.rebuild();
        await browserContext.dispose();
        await nodeContext.rebuild();
        await nodeContext.dispose();
        await electronContext.rebuild();
        await electronContext.dispose();
    } catch {
        process.exit(1);
    }
}
