import { inject, injectable } from '@theia/core/shared/inversify';
import { MenuContribution, MenuModelRegistry } from '@theia/core/lib/common/menu';
import { CommonMenus } from '@theia/core/lib/browser';
import { CommandContribution, CommandRegistry } from '@theia/core';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { VesDocumentationCommands } from './ves-documentation-commands';

@injectable()
export class VesDocumentationContribution implements MenuContribution, CommandContribution {
    @inject(WindowService)
    protected readonly windowService: WindowService;

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(VesDocumentationCommands.OPEN_TECH_SCROLL, {
            execute: () => this.windowService.openNewWindow(this.getTechScrollUrl(), { external: true }),
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(CommonMenus.HELP, {
            commandId: VesDocumentationCommands.OPEN_HANDBOOK.id,
            label: VesDocumentationCommands.OPEN_HANDBOOK.label,
            order: 'a20',
        });
    }

    protected getTechScrollUrl(): string {
        return 'https://files.virtual-boy.com/download/978651/stsvb.html';
    }
}
