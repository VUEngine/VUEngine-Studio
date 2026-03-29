import { Command, CommandContribution, CommandRegistry, CommandService } from '@theia/core';
import { AbstractViewContribution, FrontendApplication, KeybindingRegistry } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { ViewModeService } from '../../viewMode/browser/view-mode-service';
import { ViewMode } from '../../viewMode/browser/view-mode-types';
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
    @inject(ViewModeService)
    protected readonly viewModeService: ViewModeService;

    constructor() {
        super({
            widgetId: VesProjectSidebarWidget.ID,
            widgetName: VesProjectSidebarWidget.LABEL,
            defaultWidgetOptions: {
                area: 'left',
                rank: 800,
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: false, reveal: false });
    }

    async registerCommands(commandRegistry: CommandRegistry): Promise<void> {
        super.registerCommands(commandRegistry);

        commandRegistry.registerCommand(VesProjectSidebarCommands.WIDGET_TOGGLE, {
            isEnabled: () => this.viewModeService.getViewMode() === ViewMode.settings,
            isVisible: () => this.viewModeService.getViewMode() === ViewMode.settings,
            execute: () => this.toggleView()
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

