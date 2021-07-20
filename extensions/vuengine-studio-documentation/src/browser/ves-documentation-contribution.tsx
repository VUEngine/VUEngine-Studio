import { inject, injectable } from 'inversify';
import { CommandContribution, CommandRegistry } from '@theia/core/lib/common/command';
import { MenuContribution, MenuModelRegistry } from '@theia/core/lib/common/menu';
import { VesBrandingMenus } from 'vuengine-studio-branding/lib/browser/ves-branding-menus';

import { VesDocumentationCommands } from './ves-documentation-commands';
import { VesDocumentationIFrameViewContribution } from './ves-documentation-iframe-view';

@injectable()
export class VesDocumentationContribution implements CommandContribution, MenuContribution {

    @inject(VesDocumentationIFrameViewContribution)
    protected readonly iframeView: VesDocumentationIFrameViewContribution;

    registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.registerCommand(VesDocumentationCommands.OPEN_HANDBOOK, {
            execute: () => this.iframeView.openView({ reveal: true }),
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(VesBrandingMenus.VES_HELP, {
            commandId: VesDocumentationCommands.OPEN_HANDBOOK.id,
            label: VesDocumentationCommands.OPEN_HANDBOOK.label,
            order: '2',
        });
    }
}
