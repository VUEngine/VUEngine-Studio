import { CommonMenus } from '@theia/core/lib/browser/common-frontend-contribution';
import { MenuPath } from '@theia/core/lib/common/menu';

export namespace VesBrandingMenus {
    export const VES_HELP: MenuPath = [...CommonMenus.HELP, 'vesHelp'];
}
