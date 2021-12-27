import { injectable } from '@theia/core/shared/inversify';
import { ElectronMainMenuFactory } from '@theia/core/lib/electron-browser/menu/electron-main-menu-factory';
import { isOSX, MAIN_MENU_BAR } from '@theia/core';
import { remote } from 'electron';

// This fixes a bug in Theia where the main menu would not render on Mac if the MenuBarVisibility preference is set to "compact"
// TODO: remove once fixed in Theia

@injectable()
export class VesElectronMainMenuFactory extends ElectronMainMenuFactory {
    async setMenuBar(): Promise<void> {
        const createdMenuBar = this.createElectronMenuBar();
        if (isOSX) {
            remote.Menu.setApplicationMenu(createdMenuBar);
        } else {
            remote.getCurrentWindow().setMenu(createdMenuBar);
        }
    }

    createElectronMenuBar(): Electron.Menu | null {
        const menuModel = this.menuProvider.getMenu(MAIN_MENU_BAR);
        const template = this.fillMenuTemplate([], menuModel);
        if (isOSX) {
            template.unshift(this.createOSXMenu());
        }
        const menu = remote.Menu.buildFromTemplate(template);
        this._menu = menu;
        return this._menu;
    }
}
