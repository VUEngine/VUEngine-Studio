import { injectable } from 'inversify';
import { ElectronMainApplication, TheiaBrowserWindowOptions } from '@theia/core/lib/electron-main/electron-main-application';
import { isOSX } from '@theia/core';

@injectable()
export class VesElectronMainApplication extends ElectronMainApplication {
    protected async getDefaultBrowserWindowOptions(): Promise<TheiaBrowserWindowOptions> {
        return {
            ...await super.getDefaultBrowserWindowOptions(),
            frame: isOSX,
            minWidth: 820,
            minHeight: 420,
            backgroundColor: "#222",
            titleBarStyle: "hiddenInset"
        }
    }
}
