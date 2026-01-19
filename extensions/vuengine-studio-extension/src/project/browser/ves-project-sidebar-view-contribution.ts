import { Command, CommandContribution, CommandRegistry, CommandService, MenuModelRegistry } from '@theia/core';
import { AbstractViewContribution, CommonMenus, FrontendApplication, KeybindingRegistry } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesProjectSidebarWidget } from './ves-project-sidebar-widget';

export namespace VesProjectSidebarCommands {
    export const WIDGET_TOGGLE: Command = Command.toLocalizedCommand(
        {
            id: 'projectSidebar.toggleView',
            label: 'Toggle Project View',
        },
        'vuengine/projects/projectSidebar/commands/toggleView',
        'vuengine/projects/projectSidebar/commands/category'
    );
};

@injectable()
export class VesProjectSidebarViewContribution extends AbstractViewContribution<VesProjectSidebarWidget> implements CommandContribution {
    @inject(CommandService)
    protected readonly commandService: CommandService;

    constructor() {
        super({
            widgetId: VesProjectSidebarWidget.ID,
            widgetName: VesProjectSidebarWidget.LABEL,
            defaultWidgetOptions: {
                area: 'left',
                rank: -20000,
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: false, reveal: false });
    }

    async registerCommands(commandRegistry: CommandRegistry): Promise<void> {
        super.registerCommands(commandRegistry);

        commandRegistry.registerCommand(VesProjectSidebarCommands.WIDGET_TOGGLE, {
            execute: () => this.toggleView()
        });
    }

    async registerMenus(menus: MenuModelRegistry): Promise<void> {
        super.registerMenus(menus);

        menus.registerMenuAction(CommonMenus.VIEW_VIEWS, {
            commandId: VesProjectSidebarCommands.WIDGET_TOGGLE.id,
            label: this.viewLabel
        });
    }

    async registerKeybindings(keybindings: KeybindingRegistry): Promise<void> {
        super.registerKeybindings(keybindings);

        keybindings.registerKeybinding({
            command: VesProjectSidebarCommands.WIDGET_TOGGLE.id,
            keybinding: 'ctrlcmd+shift+h'
        });
    }
}

