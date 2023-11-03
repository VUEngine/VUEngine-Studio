import { JsonSchema } from '@jsonforms/core';
// import { Disposable } from '@theia/core';
import { FileContent } from '@theia/filesystem/lib/common/files';
import { VisitOptions } from 'sort-json';
import { ImageData } from '../browser/ves-common-types';

export interface VesCoreAPI {
    setZoomFactor(zoomFactor: number): void;
    getUserDefault(preference: string, type: string): string;
    dereferenceJsonSchema(schema: JsonSchema): Promise<JsonSchema>;
    sortJson<T>(old: T, options?: VisitOptions): T;
    replaceInFiles(files: string[], from: string, to: string): any;
    findFiles(base: string, pattern: string): string[];
    getPhysicalCpuCount(): number;
    parsePng(fileContent: FileContent): Promise<ImageData | false>;
    // sendTouchBarCommand(command: string, data?: any): void;
    // onTouchBarEvent(command: string, handler: (data?: any) => void): Disposable;
}

declare global {
    interface Window {
        electronVesCore: VesCoreAPI
    }
}

export const VES_CHANNEL_SET_ZOOM_FACTOR = 'setZoomFactor';
export const VES_CHANNEL_GET_USER_DEFAULT = 'getUserDefault';
export const VES_CHANNEL_DEREFERENCE_JSON_SCHEMA = 'dereferenceJsonSchema';
export const VES_CHANNEL_SORT_JSON = 'sortJson';
export const VES_CHANNEL_REPLACE_IN_FILES = 'replaceInFiles';
export const VES_CHANNEL_FIND_FILES = 'findFiles';
export const VES_CHANNEL_GET_PHYSICAL_CPU_COUNT = 'getPhysicalCpuCount';
export const VES_CHANNEL_PARSE_PNG = 'parsePng';
export const VES_CHANNEL_SEND_TOUCHBAR_COMMAND = 'sendTouchBarCommand';
export const VES_CHANNEL_ON_TOUCHBAR_EVENT = 'onTouchBarEvent';
