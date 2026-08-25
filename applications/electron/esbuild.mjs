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
import resolvePackagePath from 'resolve-package-path';
import { copy } from 'esbuild-plugin-copy';

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

/**
 * `vueport-core` is consumed through a `link:` dependency, so it resolves to a
 * checkout outside this repository that carries its own node_modules. Bundling
 * it naively pulls that tree's copies of react, @lumino/* and styled-components
 * in alongside this project's -- two Reacts means a null dispatcher ("Cannot
 * read properties of null (reading 'useRef')"), and two @lumino/widgets breaks
 * `instanceof Widget` and MessageLoop.
 *
 * Re-resolve bare imports made from outside this repository against this
 * project instead, so every shared package stays a single instance. Resolution
 * is delegated back to esbuild rather than rewritten as a path, so packages
 * that expose subpaths through an `exports` map keep working.
 */
function dedupeForeignPackagesPlugin() {
    const projectRoot = path.resolve(__dirname, '..', '..');
    return {
        name: 'dedupe-foreign-packages',
        setup(build) {
            build.onResolve({ filter: /^[^./]/ }, async args => {
                if (!args.importer || args.importer.startsWith(projectRoot)) {
                    return;
                }
                const resolved = await build.resolve(args.path, {
                    kind: args.kind,
                    resolveDir: __dirname,
                    pluginData: { dedupeForeignPackages: true }
                });
                // Fall through to the default resolver when this project does
                // not provide the package, rather than failing the build.
                return resolved.errors.length > 0 ? undefined : resolved;
            });
        }
    };
}

/**
 * A `link:` dependency does not install its own dependencies, so everything
 * vueport-core requires has to be provided by this project. Check that up front
 * -- otherwise the plugin above silently falls back to the linked checkout's
 * copy and the duplicate-instance bugs reappear.
 */
function assertVueportDepsAvailable() {
    const manifest = require('vueport-core/package.json');
    const missing = Object.keys(manifest.dependencies ?? {})
        .filter(dep => !resolvePackagePath(dep, __dirname));
    if (missing.length > 0) {
        throw new Error(
            `vueport-core depends on ${missing.join(', ')}, which this application cannot resolve. ` +
            'Declare them in vuengine-studio-extension so a single copy is shared.'
        );
    }
}

assertVueportDepsAvailable();
for (const options of [browserOptions, nodeOptions, electronOptions]) {
    options.plugins.unshift(dedupeForeignPackagesPlugin());
}

const vueportWasmDir = path.join(path.dirname(resolvePackagePath('vueport-core', __dirname)), 'wasm');
nodeOptions.plugins.push(copy({
    assets: [
        {
            from: path.join(vueportWasmDir, '*'),
            to: path.join(__dirname, 'lib', 'backend', 'emulator')
        }
    ]
}));

browserOptions.entryPoints['vb-worker'] = require.resolve('vueport-core/lib/worker/vb-worker.js');
browserOptions.entryPoints['vb-audio-worklet'] = require.resolve('vueport-core/lib/worker/vb-audio-worklet.js');
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
