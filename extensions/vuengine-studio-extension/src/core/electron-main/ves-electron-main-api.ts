import { default as $RefParser, default as JSONSchema } from '@apidevtools/json-schema-ref-parser';
import { MaybePromise } from '@theia/core';
import { ElectronMainApplication, ElectronMainApplicationContribution } from '@theia/core/lib/electron-main/electron-main-application';
import {
    ipcMain, systemPreferences
} from '@theia/electron/shared/electron';
import { glob } from 'glob';
import { injectable } from 'inversify';
import sortJson from 'sort-json';
import {
    VES_CHANNEL_DEREFERENCE_JSON_SCHEMA,
    VES_CHANNEL_FIND_FILES,
    VES_CHANNEL_GET_PHYSICAL_CPU_COUNT,
    VES_CHANNEL_GET_USER_DEFAULT,
    VES_CHANNEL_REPLACE_IN_FILES,
    VES_CHANNEL_SET_ZOOM_FACTOR,
    VES_CHANNEL_SORT_JSON
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
        ipcMain.on(VES_CHANNEL_DEREFERENCE_JSON_SCHEMA, (event, schema) => {
            event.returnValue = $RefParser.dereference(schema as JSONSchema);
        });
        ipcMain.on(VES_CHANNEL_SORT_JSON, (event, old, options) => {
            event.returnValue = sortJson(old, options);
        });
        ipcMain.on(VES_CHANNEL_REPLACE_IN_FILES, (event, files, from, to) => {
            const replaceInFiles = require('replace-in-file');
            event.returnValue = replaceInFiles({ files, from, to });
        });
        ipcMain.on(VES_CHANNEL_FIND_FILES, (event, base, pattern) => {
            const results: string[] = [];
            const foundFiles = glob.sync(`${base}/${pattern}`);
            for (const foundFile of foundFiles) {
                results.push(foundFile);
            };

            event.returnValue = results;
        });
        ipcMain.on(VES_CHANNEL_GET_PHYSICAL_CPU_COUNT, event => {
            event.returnValue = require('physical-cpu-count');
        });
    }
}
