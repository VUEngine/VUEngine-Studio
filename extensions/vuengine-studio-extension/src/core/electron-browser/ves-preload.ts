import { VES_CHANNEL_GET_USER_DEFAULT, VES_CHANNEL_SET_ZOOM_FACTOR, VesCoreAPI } from '../electron-common/ves-electron-api';

// eslint-disable-next-line import/no-extraneous-dependencies
const { ipcRenderer, contextBridge } = require('electron');

const api: VesCoreAPI = {
    setZoomFactor: function (zoomFactor: number): void {
        ipcRenderer.send(VES_CHANNEL_SET_ZOOM_FACTOR, zoomFactor);
    },
    getUserDefault: function (preference: string, type: string): string {
        return ipcRenderer.sendSync(VES_CHANNEL_GET_USER_DEFAULT, preference, type);
    },
};

export function preload(): void {
    console.log('exposing ves core electron api');
    contextBridge.exposeInMainWorld('electronVesCore', api);
}
