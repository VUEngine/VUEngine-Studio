import { default as $RefParser, default as JSONSchema } from '@apidevtools/json-schema-ref-parser';
import { MaybePromise } from '@theia/core';
import { ElectronMainApplication, ElectronMainApplicationContribution } from '@theia/core/lib/electron-main/electron-main-application';
import {
    ipcMain, systemPreferences
} from '@theia/electron/shared/electron';
import { injectable } from 'inversify';
import sortJson from 'sort-json';
import { VES_CHANNEL_DEREFERENCE_JSON_SCHEMA, VES_CHANNEL_GET_USER_DEFAULT, VES_CHANNEL_SET_ZOOM_FACTOR, VES_CHANNEL_SORT_JSON } from '../electron-common/ves-electron-api';

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
    }
}
