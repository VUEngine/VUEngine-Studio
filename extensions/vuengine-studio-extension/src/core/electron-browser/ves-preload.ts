import { JsonSchema } from '@jsonforms/core';
import { VisitOptions } from 'sort-json';
import {
    VES_CHANNEL_DEREFERENCE_JSON_SCHEMA,
    VES_CHANNEL_FIND_FILES,
    VES_CHANNEL_GET_USER_DEFAULT,
    VES_CHANNEL_REPLACE_IN_FILES,
    VES_CHANNEL_SET_ZOOM_FACTOR,
    VES_CHANNEL_SORT_JSON,
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
    dereferenceJsonSchema: function (schema: JsonSchema): Promise<JsonSchema> {
        return ipcRenderer.sendSync(VES_CHANNEL_DEREFERENCE_JSON_SCHEMA, schema);
    },
    sortJson<T>(old: T, options?: VisitOptions): T {
        return ipcRenderer.sendSync(VES_CHANNEL_SORT_JSON, old, options);
    },
    replaceInFiles(files: string[], from: string, to: string): any {
        return ipcRenderer.sendSync(VES_CHANNEL_REPLACE_IN_FILES, files, from, to);
    },
    findFiles(base: string, pattern: string): string[] {
        return ipcRenderer.sendSync(VES_CHANNEL_FIND_FILES, base, pattern);
    },
};

export function preload(): void {
    console.log('exposing ves core electron api');
    contextBridge.exposeInMainWorld('electronVesCore', api);
}
