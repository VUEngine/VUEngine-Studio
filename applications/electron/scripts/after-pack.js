#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const util = require('util');
const child_process = require('child_process');
const rimraf = require('rimraf');
// const sign_util = require('app-builder-lib/electron-osx-sign/util');
const asyncRimraf = util.promisify(rimraf);

const DELETE_PATHS = [
    'node_modules/unzip-stream/aa.zip',
    'node_modules/unzip-stream/testData*',
    'vuengine/core/.git',
    'vuengine/core/.gitattributes',
    'vuengine/core/.github',
    'vuengine/core/.gitignore',
    'vuengine/plugins/.git',
    'vuengine/plugins/.gitattributes',
    'vuengine/plugins/.github',
    'vuengine/plugins/.gitignore',
];

const EXECUTABLE_PATHS = [
    'binaries/vuengine-studio-tools/${os}/gcc/bin',
    'binaries/vuengine-studio-tools/${os}/gcc/libexec/gcc/v810/4.7.4',
    'binaries/vuengine-studio-tools/${os}/gcc/v810/bin',
    'binaries/vuengine-studio-tools/${os}/grit/grit',
    'binaries/vuengine-studio-tools/${os}/hb-cli/hbcli',
    'binaries/vuengine-studio-tools/${os}/hf-cli/hfcli',
    'binaries/vuengine-studio-tools/${os}/make/make',
    'binaries/vuengine-studio-tools/${os}/prog-vb/prog-vb',
    'vuengine/core/lib/compiler/preprocessor',
];

const LIBRARY_PATHS = [
    'vuengine',
];

const signCommand = path.join(__dirname, 'sign.sh');
// const notarizeCommand = path.join(__dirname, 'notarize.sh');
const entitlements = path.resolve(__dirname, '..', 'entitlements.plist');

const signFile = file => {
    const stat = fs.lstatSync(file);
    const mode = stat.isFile() ? stat.mode : undefined;

    console.log(`Signing ${file}...`);
    child_process.execFileSync(signCommand, [
        path.basename(file),
        entitlements
    ], {
        cwd: path.dirname(file),
        maxBuffer: 1024 * 10000
    });

    if (mode) {
        console.log(`Setting attributes of ${file}...`);
        fs.chmodSync(file, mode);
    }
};

exports.default = async function (context) {
    const appPath = path.resolve(context.appOutDir, context.packager.platform.name === 'mac'
        ? `${context.packager.appInfo.productFilename}.app/Contents/Resources/app/`
        : 'resources/app/');

    const os = context.packager.platform.name
        .replace('mac', 'osx')
        .replace('windows', 'linux'); // on Windows, we just need to chmod Linux gcc for use in WSL
    const replaceOs = p => p.replace('${os}', os);

    // Remove anything we don't want in the final package
    for (const deletePath of DELETE_PATHS) {
        const resolvedPath = path.resolve(appPath, replaceOs(deletePath));
        console.log(`Deleting ${resolvedPath}...`);
        await asyncRimraf(resolvedPath);
    }

    const recursiveChmod = (paths, permissions) => {
        for (const p of paths) {
            const resolvedPath = path.resolve(appPath, replaceOs(p));
            if (fs.existsSync(resolvedPath)) {
                if (fs.lstatSync(resolvedPath).isDirectory()) {
                    const files = fs.readdirSync(resolvedPath);
                    files.forEach(file => {
                        recursiveChmod([path.resolve(resolvedPath, file)], permissions);
                    });
                } else {
                    console.log(`chmod ${resolvedPath} ${permissions}`);
                    fs.chmodSync(resolvedPath, permissions);
                }
            }
        }
    };

    // Set executable flags on binaries
    recursiveChmod(EXECUTABLE_PATHS, '755');

    // Make bundled libs read-only
    recursiveChmod(LIBRARY_PATHS, '444');

    // Only continue for macOS
    if (context.packager.platform.name !== 'mac') {
        return;
    }

    /*
    // Use app-builder-lib to find all binaries to sign, at this level it will include the final .app
    let childPaths = await sign_util.walkAsync(context.appOutDir);

    // Sign deepest first
    // From https://github.com/electron-userland/electron-builder/blob/master/packages/app-builder-lib/electron-osx-sign/sign.js#L120
    childPaths = childPaths.sort((a, b) => {
        const aDepth = a.split(path.sep).length;
        const bDepth = b.split(path.sep).length;
        return bDepth - aDepth;
    });

    // Sign binaries
    childPaths.forEach(file => signFile(file, context.appOutDir));
    */
    /*
        // Notarize app
        child_process.execFileSync(notarizeCommand, [
            path.basename(appPath),
            context.packager.appInfo.info._configuration.appId
        ], {
            cwd: path.dirname(appPath),
            maxBuffer: 1024 * 10000
        });
    */
};
