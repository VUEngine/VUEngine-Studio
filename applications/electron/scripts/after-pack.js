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
    'node_modules/unzip-stream/testData*'
];

const EXECUTABLE_PATHS = [
    'binaries/vuengine-studio-tools/osx/gcc/bin',
    'binaries/vuengine-studio-tools/osx/gcc/libexec/gcc/v810/4.7.4',
    'binaries/vuengine-studio-tools/osx/gcc/v810/bin',
    'binaries/vuengine-studio-tools/osx/grit/grit',
    'binaries/vuengine-studio-tools/osx/hb-cli/hbcli',
    'binaries/vuengine-studio-tools/osx/hf-cli/hfcli',
    'binaries/vuengine-studio-tools/osx/make/make',
    'vuengine/core/lib/compiler/preprocessor',
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
    // Do not continue for Windows
    if (context.packager.platform.name !== 'mac' && context.packager.platform.name !== 'linux') {
        return;
    }

    const appPath = path.resolve(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);

    const appDir = context.packager.platform.name === 'mac'
        ? 'Contents/Resources/app/'
        : 'resources/app/';

    // Remove anything we don't want in the final package
    for (const deletePath of DELETE_PATHS) {
        const resolvedPath = path.resolve(appPath, appDir + deletePath);
        console.log(`Deleting ${resolvedPath}...`);
        await asyncRimraf(resolvedPath);
    }

    // Set executable flags
    for (const execPath of EXECUTABLE_PATHS) {
        const resolvedPath = path.resolve(appPath, appDir + execPath);
        console.log(`chmod ${resolvedPath}...`);
        if (fs.existsSync(resolvedPath)) {
            if (fs.lstatSync(resolvedPath).isDirectory()) {
                const files = fs.readdirSync(resolvedPath);
                files.forEach(file => {
                    fs.chmodSync(path.resolve(resolvedPath, file), '755');
                });
            } else {
                fs.chmodSync(resolvedPath, '755');
            }
        }
    }

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
