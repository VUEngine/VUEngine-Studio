import { isOSX, MAIN_MENU_BAR } from '@theia/core';
import { getCurrentWindow, Menu } from '@theia/core/electron-shared/@electron/remote';
import { ElectronMainMenuFactory } from '@theia/core/lib/electron-browser/menu/electron-main-menu-factory';
import { injectable } from '@theia/core/shared/inversify';

// This fixes a bug in Theia where the main menu would not render on Mac if the MenuBarVisibility preference is set to "compact"
// TODO: remove once fixed in Theia

@injectable()
export class VesElectronMainMenuFactory extends ElectronMainMenuFactory {
    async setMenuBar(): Promise<void> {
        const createdMenuBar = this.createElectronMenuBar();
        if (isOSX) {
            Menu.setApplicationMenu(createdMenuBar);
        } else {
            getCurrentWindow().setMenu(createdMenuBar);
        }
    }

    createElectronMenuBar(): Electron.Menu | null {
        const menuModel = this.menuProvider.getMenu(MAIN_MENU_BAR);
        const template = this.fillMenuTemplate([], menuModel);
        if (isOSX) {
            template.unshift(this.createOSXMenu());
        }
        const menu = Menu.buildFromTemplate(template);
        this._menu = menu;
        return this._menu;
    }

    protected createOSXMenu(): Electron.MenuItemConstructorOptions {
        return {
            label: 'VUEngine Studio',
            submenu: [
                {
                    role: 'services',
                    submenu: []
                },
                {
                    type: 'separator'
                },
                {
                    role: 'hide'
                },
                {
                    role: 'hideOthers'
                },
                {
                    role: 'unhide'
                },
                {
                    type: 'separator'
                },
                {
                    role: 'quit'
                }
            ]
        };
    }
}
