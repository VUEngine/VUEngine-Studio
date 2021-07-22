import { inject, injectable } from 'inversify';
import { CommandContribution, CommandRegistry } from '@theia/core/lib/common/command';
import { MenuContribution, MenuModelRegistry } from '@theia/core/lib/common/menu';
import { VesBrandingMenus } from 'vuengine-studio-branding/lib/browser/ves-branding-menus';

import { VesDocumentationIFrameViewContribution } from './ves-documentation-iframe-view';
import { VesDocumentationTreeCommands } from './tree/ves-documentation-tree-contribution';

@injectable()
export class VesDocumentationContribution implements CommandContribution, MenuContribution {

    @inject(VesDocumentationIFrameViewContribution)
    protected readonly iframeView: VesDocumentationIFrameViewContribution;

    registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.registerCommand(VesDocumentationTreeCommands.OPEN, {
            execute: () => this.iframeView.openView({ reveal: true }),
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(VesBrandingMenus.VES_HELP, {
            commandId: VesDocumentationTreeCommands.OPEN.id,
            label: VesDocumentationTreeCommands.OPEN.label,
            order: '2',
        });
    }
}
