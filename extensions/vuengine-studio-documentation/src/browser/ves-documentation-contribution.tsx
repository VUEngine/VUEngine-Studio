import { injectable } from 'inversify';
import { MenuContribution, MenuModelRegistry } from '@theia/core/lib/common/menu';

import { VesDocumentationCommands } from './ves-documentation-commands';
import { CommonMenus } from '@theia/core/lib/browser';

@injectable()
export class VesDocumentationContribution implements MenuContribution {
    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(CommonMenus.HELP, {
            commandId: VesDocumentationCommands.OPEN_HANDBOOK.id,
            label: VesDocumentationCommands.OPEN_HANDBOOK.label,
            order: '2',
        });
    }
}
