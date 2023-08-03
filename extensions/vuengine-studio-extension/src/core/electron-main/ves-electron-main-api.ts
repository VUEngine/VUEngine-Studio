import { MaybePromise } from '@theia/core';
import { ElectronMainApplication, ElectronMainApplicationContribution } from '@theia/core/lib/electron-main/electron-main-application';
import {
    ipcMain, systemPreferences
} from '@theia/electron/shared/electron';
import { injectable } from 'inversify';
import { VES_CHANNEL_GET_USER_DEFAULT, VES_CHANNEL_SET_ZOOM_FACTOR } from '../electron-common/ves-electron-api';

@injectable()
export class VesMainApi implements ElectronMainApplicationContribution {
    onStart(application: ElectronMainApplication): MaybePromise<void> {
        ipcMain.on(VES_CHANNEL_SET_ZOOM_FACTOR, (event, zoomFactor) => {
            event.sender.setZoomFactor(zoomFactor);
        });
        ipcMain.on(VES_CHANNEL_GET_USER_DEFAULT, (event, preference, type) => {
            event.returnValue = systemPreferences.getUserDefault(preference, type);
        });
    }
}
