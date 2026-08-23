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

browserOptions.entryPoints['ves-vb-worker'] =
    require.resolve('vuengine-studio-extension/lib/emulator/worker/ves-vb-worker.js');
browserOptions.entryPoints['ves-vb-audio-worklet'] =
    require.resolve('vuengine-studio-extension/lib/emulator/worker/ves-vb-audio-worklet.js');

nodeOptions.entryPoints['image-converter-worker'] = require.resolve('vb-image-converter/lib/worker.js');

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
