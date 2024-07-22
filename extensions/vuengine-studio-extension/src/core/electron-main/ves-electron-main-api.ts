import { default as $RefParser, default as JSONSchema } from '@apidevtools/json-schema-ref-parser';
import { Octokit } from '@octokit/rest';
import { Disposable, MaybePromise, isWindows } from '@theia/core';
import { ElectronMainApplication, ElectronMainApplicationContribution } from '@theia/core/lib/electron-main/electron-main-application';
import { createDisposableListener } from '@theia/core/lib/electron-main/event-utils';
import {
    IpcMainEvent,
    ipcMain, systemPreferences
} from '@theia/electron/shared/electron';
import { FileContent } from '@theia/filesystem/lib/common/files';
import { getTempDir } from '@theia/plugin-ext/lib/main/node/temp-dir-util';
import * as decompress from 'decompress';
import { WebContents } from 'electron';
import { glob } from 'glob';
import sizeOf from 'image-size';
import { injectable } from 'inversify';
import sortJson from 'sort-json';
import * as si from 'systeminformation';
import zlib from 'zlib';
import { ImageData } from '../browser/ves-common-types';
import {
    VES_CHANNEL_CHECK_UPDATE_AVAILABLE,
    VES_CHANNEL_DECOMPRESS,
    VES_CHANNEL_DEREFERENCE_JSON_SCHEMA,
    VES_CHANNEL_FIND_FILES,
    VES_CHANNEL_GET_CPU_INFORMATION,
    VES_CHANNEL_GET_IMAGE_DIMENSIONS,
    VES_CHANNEL_GET_TEMP_DIR,
    VES_CHANNEL_GET_USER_DEFAULT,
    VES_CHANNEL_ON_SERIAL_DEVICE_CHANGE,
    VES_CHANNEL_ON_TOUCHBAR_EVENT,
    VES_CHANNEL_ON_USB_DEVICE_CHANGE,
    VES_CHANNEL_PARSE_PNG,
    VES_CHANNEL_REPLACE_IN_FILES,
    VES_CHANNEL_SEND_TOUCHBAR_COMMAND,
    VES_CHANNEL_SET_ZOOM_FACTOR,
    VES_CHANNEL_SORT_JSON,
    VES_CHANNEL_ZLIB_DEFLATE
} from '../electron-common/ves-electron-api';

@injectable()
export class VesMainApi implements ElectronMainApplicationContribution {
    onStart(application: ElectronMainApplication): MaybePromise<void> {
        ipcMain.on(VES_CHANNEL_SET_ZOOM_FACTOR, (event, zoomFactor) => {
            event.sender.setZoomFactor(zoomFactor);
        });
        ipcMain.on(VES_CHANNEL_GET_USER_DEFAULT, (event, preference, type) => {
            event.returnValue = systemPreferences.getUserDefault(preference, type);
        });
        ipcMain.on(VES_CHANNEL_GET_TEMP_DIR, event => {
            const tempDir = getTempDir('vuengine');
            event.returnValue = isWindows ? `/${tempDir}` : tempDir;
        });
        ipcMain.handle(VES_CHANNEL_DEREFERENCE_JSON_SCHEMA, (event, schema) =>
            $RefParser.dereference(schema as JSONSchema)
        );
        ipcMain.on(VES_CHANNEL_SORT_JSON, (event, old, options) => {
            event.returnValue = sortJson(old, options);
        });
        ipcMain.handle(VES_CHANNEL_REPLACE_IN_FILES, (event, files, from, to) => {
            const replaceInFiles = require('replace-in-file');
            return new Promise((resolve, reject) => {
                // @ts-ignore: suppress implicit any errors
                replaceInFiles({ files, from, to }).then(({ changedFiles }) => {
                    resolve(changedFiles);
                });
            });
        });
        ipcMain.handle(VES_CHANNEL_CHECK_UPDATE_AVAILABLE, async (event, currentVersion) => {
            const octokit = new Octokit();
            const semver = require('semver');

            const latestRelease = await octokit.rest.repos.getLatestRelease({
                owner: 'VUEngine',
                repo: 'VUEngine-Studio',
            });
            const newestVersion = latestRelease.data.tag_name.replace('v', '');

            if (semver.gt(newestVersion, currentVersion)) {
                return newestVersion;
            } else {
                return false;
            }
        });
        ipcMain.on(VES_CHANNEL_ZLIB_DEFLATE, (event, data) => {
            event.returnValue = zlib.deflateSync(data);
        });
        ipcMain.on(VES_CHANNEL_FIND_FILES, (event, base, pattern, options) => {
            const results: string[] = [];
            const foundFiles = glob.sync(pattern, {
                cwd: base,
                ...(options || {})
            });
            for (const foundFile of foundFiles) {
                results.push(foundFile);
            };

            event.returnValue = results;
        });
        ipcMain.handle(VES_CHANNEL_DECOMPRESS, async (event, archivePath, targetPath) =>
            (await decompress.default(archivePath, targetPath)).map(f => f.path)
        );
        ipcMain.on(VES_CHANNEL_GET_IMAGE_DIMENSIONS, async (event, path: string) => {
            event.returnValue = sizeOf(path);
        });
        ipcMain.handle(VES_CHANNEL_GET_CPU_INFORMATION, async () => si.cpu());
        ipcMain.handle(VES_CHANNEL_PARSE_PNG, async (event, fileContent: FileContent) => {
            const PNG = require('@camoto/pngjs').PNG;
            let imageData: ImageData | false = false;

            await new Promise<void>((resolve, reject) => {
                new PNG({
                    keepIndexed: true,
                }).parse(fileContent.value.buffer, (error: unknown, data: unknown): void => {
                    if (error) {
                        console.error('Error while parsing PNG', error, data);
                        resolve();
                    }
                }).on('parsed', function (): void {
                    // @ts-ignore: suppress implicit any errors
                    const png = this;

                    const height = png.height;
                    const width = png.width;
                    const colorType = png._parser._parser._colorType;

                    const pixelData: number[][] = [];
                    [...Array(height)].map((h, y) => {
                        const line: number[] = [];
                        [...Array(width)].map((w, x) => {
                            line.push(png.data[y * width + x]);
                        });
                        pixelData.push(line);
                    });

                    imageData = { height, width, colorType, pixelData };

                    resolve();
                });
            });

            return imageData;
        });
    }
}

export namespace VesRendererAPI {
    export function sendUsbDeviceChange(wc: WebContents): void {
        wc.send(VES_CHANNEL_ON_USB_DEVICE_CHANGE);
    }
    export function sendSerialDeviceChange(wc: WebContents): void {
        wc.send(VES_CHANNEL_ON_SERIAL_DEVICE_CHANGE);
    }
    export function sendTouchBarEvent(wc: WebContents, event: string, data?: any): void {
        wc.send(VES_CHANNEL_ON_TOUCHBAR_EVENT, event, data);
    }
    export function onTouchBarCommand(wc: WebContents, command: string, handler: (data?: any) => void): Disposable {
        return createDisposableListener<IpcMainEvent>(ipcMain, VES_CHANNEL_SEND_TOUCHBAR_COMMAND, (event, cmd: string, data?: any) => {
            if (wc.id === event.sender.id) {
                if (command === cmd) {
                    handler(data);
                }
            }
        });
    }
}
