import { isOSX, MAIN_MENU_BAR } from '@theia/core';
import { ElectronMainMenuFactory } from '@theia/core/lib/electron-browser/menu/electron-main-menu-factory';
import { MenuDto } from '@theia/core/lib/electron-common/electron-api';
import { injectable } from '@theia/core/shared/inversify';

@injectable()
export class VesElectronMainMenuFactory extends ElectronMainMenuFactory {
    createElectronMenuBar(): MenuDto[] | undefined {
        const menuModel = this.menuProvider.getMenu(MAIN_MENU_BAR);
        this._menu = this.fillMenuTemplate([], menuModel, [], { /* honorDisabled: false, */ rootMenuPath: MAIN_MENU_BAR }, false);
        if (isOSX) {
            this._menu.unshift(this.createOSXMenu());
        }
        return this._menu;
    }

    protected createOSXMenu(): MenuDto {
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
