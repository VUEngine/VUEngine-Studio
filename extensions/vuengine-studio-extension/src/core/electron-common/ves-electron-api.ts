import { JsonSchema } from '@jsonforms/core';
import { Disposable } from '@theia/core/lib/common/disposable';
import { GlobOptionsWithFileTypesUnset } from 'glob';
import { ISizeCalculationResult } from 'image-size/dist/types/interface';
import { VisitOptions } from 'sort-json';
import { Systeminformation } from 'systeminformation';

export interface VesCoreAPI {
    getUserDefault(preference: string, type: string): string;
    getTempDir(): string;
    dereferenceJsonSchema(schema: JsonSchema): Promise<JsonSchema>;
    sortJson<T>(old: T, options?: VisitOptions): T;
    replaceInFiles(files: string[], from: string, to: string): Promise<number>;
    checkUpdateAvailable(currentVersion: string): Promise<string | boolean>;
    zlibDeflate(data: Buffer): Buffer;
    findFiles(base: string, pattern: string | string[], options?: GlobOptionsWithFileTypesUnset): string[];
    decompress(archivePath: string, targetPath: string): Promise<string[]>;
    getImageDimensions(path: string): ISizeCalculationResult;
    getCpuInformation(): Promise<Systeminformation.CpuData>;
    onUsbDeviceChange(handler: () => void): Disposable;
    onSerialDeviceChange(handler: () => void): Disposable;
    sendTouchBarCommand(command: string, data?: any): void;
    onTouchBarEvent(command: string, handler: (data?: any) => void): Disposable;
}

declare global {
    interface Window {
        electronVesCore: VesCoreAPI
    }
}

export const VES_CHANNEL_GET_USER_DEFAULT = 'vesGetUserDefault';
export const VES_CHANNEL_DECOMPRESS = 'vesDecompress';
export const VES_CHANNEL_DEREFERENCE_JSON_SCHEMA = 'vesDereferenceJsonSchema';
export const VES_CHANNEL_SORT_JSON = 'vesSortJson';
export const VES_CHANNEL_REPLACE_IN_FILES = 'vesReplaceInFiles';
export const VES_CHANNEL_FIND_FILES = 'vesFindFiles';
export const VES_CHANNEL_GET_IMAGE_DIMENSIONS = 'vesGetIageDimensions';
export const VES_CHANNEL_GET_CPU_INFORMATION = 'vesGetCpuInformation';
export const VES_CHANNEL_GET_TEMP_DIR = 'vesGetTempDir';
export const VES_CHANNEL_ON_USB_DEVICE_CHANGE = 'vesOnUsbDeviceChange';
export const VES_CHANNEL_ON_SERIAL_DEVICE_CHANGE = 'vesOnSerialDeviceChange';
export const VES_CHANNEL_SEND_TOUCHBAR_COMMAND = 'vesSendTouchBarCommand';
export const VES_CHANNEL_ON_TOUCHBAR_EVENT = 'vesOnTouchBarEvent';
export const VES_CHANNEL_CHECK_UPDATE_AVAILABLE = 'vesCheckUpdateAvailable';
export const VES_CHANNEL_ZLIB_DEFLATE = 'vesCheckZlibDeflate';
