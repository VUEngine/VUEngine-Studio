import { isOSX, MAIN_MENU_BAR } from '@theia/core';
import { ElectronMainMenuFactory } from '@theia/core/lib/electron-browser/menu/electron-main-menu-factory';
import { MenuDto } from '@theia/core/lib/electron-common/electron-api';
import { injectable } from '@theia/core/shared/inversify';

@injectable()
export class VesElectronMainMenuFactory extends ElectronMainMenuFactory {
    createElectronMenuBar(): MenuDto[] {
        const menuModel = this.menuProvider.getMenu(MAIN_MENU_BAR)!;
        const menu = this.fillMenuTemplate([], MAIN_MENU_BAR, menuModel, [], this.contextKeyService, { /* honorDisabled: false, */ }, false);

        if (isOSX) {
            menu.unshift(this.createOSXMenu());
        }
        return menu;
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
