import { injectable } from 'inversify';
import { BrowserWindow } from 'electron';
import { ElectronMainApplication, TheiaBrowserWindowOptions } from '@theia/core/lib/electron-main/electron-main-application';
import { isOSX, MaybePromise } from '@theia/core';

@injectable()
export class VesElectronMainApplication extends ElectronMainApplication {
    async createWindow(asyncOptions: MaybePromise<TheiaBrowserWindowOptions> = this.getDefaultBrowserWindowOptions()): Promise<BrowserWindow> {
        const electronWindow = await super.createWindow(asyncOptions);
        // electronWindow.on('focus', () => electronWindow.setOpacity(1));
        // electronWindow.on('blur', () => electronWindow.setOpacity(0.95));
        return electronWindow;
    }

    protected async getDefaultBrowserWindowOptions(): Promise<TheiaBrowserWindowOptions> {
        return {
            ...await super.getDefaultBrowserWindowOptions(),
            backgroundColor: "#222",
            frame: isOSX,
            minHeight: 420,
            minWidth: 820,
            titleBarStyle: "hiddenInset"
        }
    }
}
