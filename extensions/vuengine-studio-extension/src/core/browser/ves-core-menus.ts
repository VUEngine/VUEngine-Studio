import { CommonMenus } from '@theia/core/lib/browser';
import { MenuPath } from '@theia/core/lib/common/menu';

export namespace VesCoreMenus {
    export const VES_HELP: MenuPath = [...CommonMenus.HELP, 'vesHelp'];
}
