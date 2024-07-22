import { JsonSchema } from '@jsonforms/core';
import { Disposable } from '@theia/core/lib/common/disposable';
import { FileContent } from '@theia/filesystem/lib/common/files';
import { GlobOptionsWithFileTypesUnset } from 'glob';
import { ISizeCalculationResult } from 'image-size/dist/types/interface';
import { VisitOptions } from 'sort-json';
import { Systeminformation } from 'systeminformation';
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
    VES_CHANNEL_ZLIB_DEFLATE,
    VesCoreAPI
} from '../electron-common/ves-electron-api';

const { ipcRenderer, contextBridge } = require('electron');

const api: VesCoreAPI = {
    setZoomFactor: function (zoomFactor: number): void {
        ipcRenderer.send(VES_CHANNEL_SET_ZOOM_FACTOR, zoomFactor);
    },
    getUserDefault: function (preference: string, type: string): string {
        return ipcRenderer.sendSync(VES_CHANNEL_GET_USER_DEFAULT, preference, type);
    },
    getTempDir: function (): string {
        return ipcRenderer.sendSync(VES_CHANNEL_GET_TEMP_DIR);
    },
    dereferenceJsonSchema: function (schema: JsonSchema): Promise<JsonSchema> {
        return ipcRenderer.invoke(VES_CHANNEL_DEREFERENCE_JSON_SCHEMA, schema);
    },
    sortJson<T>(old: T, options?: VisitOptions): T {
        return ipcRenderer.sendSync(VES_CHANNEL_SORT_JSON, old, options);
    },
    replaceInFiles: function (files: string[], from: string, to: string): Promise<number> {
        return ipcRenderer.invoke(VES_CHANNEL_REPLACE_IN_FILES, files, from, to);
    },
    decompress: function (archivePath: string, targetPath: string): Promise<string[]> {
        return ipcRenderer.invoke(VES_CHANNEL_DECOMPRESS, archivePath, targetPath);
    },
    checkUpdateAvailable: function (currentVersion: string): Promise<string | boolean> {
        return ipcRenderer.invoke(VES_CHANNEL_CHECK_UPDATE_AVAILABLE, currentVersion);
    },
    zlibDeflate: function (data: Buffer): Buffer {
        return ipcRenderer.sendSync(VES_CHANNEL_ZLIB_DEFLATE, data);
    },
    findFiles: function (base: string, pattern: string | string[], options?: GlobOptionsWithFileTypesUnset): string[] {
        return ipcRenderer.sendSync(VES_CHANNEL_FIND_FILES, base, pattern, options);
    },
    getImageDimensions: function (path: string): ISizeCalculationResult {
        return ipcRenderer.sendSync(VES_CHANNEL_GET_IMAGE_DIMENSIONS, path);
    },
    getCpuInformation: function (): Promise<Systeminformation.CpuData> {
        return ipcRenderer.invoke(VES_CHANNEL_GET_CPU_INFORMATION);
    },
    parsePng: async function (fileContent: FileContent): Promise<ImageData | false> {
        return ipcRenderer.invoke(VES_CHANNEL_PARSE_PNG, fileContent);
    },
    onUsbDeviceChange: function (handler: () => void): Disposable {
        const h = (_event: unknown) => {
            handler();
        };
        ipcRenderer.on(VES_CHANNEL_ON_USB_DEVICE_CHANGE, h);
        return Disposable.create(() => ipcRenderer.off(VES_CHANNEL_ON_USB_DEVICE_CHANGE, h));
    },
    onSerialDeviceChange: function (handler: () => void): Disposable {
        const h = (_event: unknown) => {
            handler();
        };
        ipcRenderer.on(VES_CHANNEL_ON_SERIAL_DEVICE_CHANGE, h);
        return Disposable.create(() => ipcRenderer.off(VES_CHANNEL_ON_SERIAL_DEVICE_CHANGE, h));
    },
    sendTouchBarCommand: function (command: string, data?: any): void {
        ipcRenderer.send(VES_CHANNEL_SEND_TOUCHBAR_COMMAND, command, data);
    },
    onTouchBarEvent: function (command: string, handler: (data?: any) => void): Disposable {
        const h = (_event: unknown, cmd: string, data?: any) => {
            if (command === cmd) {
                handler(data);
            }
        };
        ipcRenderer.on(VES_CHANNEL_ON_TOUCHBAR_EVENT, h);
        return Disposable.create(() => ipcRenderer.off(VES_CHANNEL_ON_TOUCHBAR_EVENT, h));
    },
};

export function preload(): void {
    console.log('exposing ves core electron api');
    contextBridge.exposeInMainWorld('electronVesCore', api);
}
