import { Command, CommandRegistry, CommandService } from '@theia/core';
import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesCoreCommands } from '../../core/browser/ves-core-commands';
import { ViewModeService } from '../../viewMode/browser/view-mode-service';
import { ViewMode } from '../../viewMode/browser/view-mode-types';
import { VesEmulatorSidebarWidget } from './ves-emulator-sidebar-widget';

export namespace VesEmulatorSidebarCommands {
    export const WIDGET_TOGGLE: Command = Command.toLocalizedCommand(
        {
            id: 'emulatorSidebar.toggleView',
            label: 'Toggle Emulator View',
        },
        'vuengine/emulator/sidebar/commands/toggleView',
        'vuengine/emulator/sidebar/commands/category'
    );

    export const WIDGET_HELP: Command = Command.toLocalizedCommand(
        {
            id: 'emulatorSidebar.showHelp',
            label: 'Show Documentation',
            iconClass: 'codicon codicon-book',
        },
        'vuengine/emulator/sidebar/commands/showDocumentation',
        'vuengine/emulator/sidebar/commands/category'
    );
};

@injectable()
export class VesEmulatorSidebarViewContribution extends AbstractViewContribution<VesEmulatorSidebarWidget> implements TabBarToolbarContribution {
    @inject(CommandService)
    protected readonly commandService: CommandService;
    @inject(ViewModeService)
    protected readonly viewModeService: ViewModeService;

    constructor() {
        super({
            widgetId: VesEmulatorSidebarWidget.ID,
            widgetName: VesEmulatorSidebarWidget.LABEL,
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

        commandRegistry.registerCommand(VesEmulatorSidebarCommands.WIDGET_TOGGLE, {
            isEnabled: () => this.viewModeService.getViewMode() === ViewMode.build,
            isVisible: () => this.viewModeService.getViewMode() === ViewMode.build,
            execute: () => this.toggleView()
        });

        commandRegistry.registerCommand(VesEmulatorSidebarCommands.WIDGET_HELP, {
            isEnabled: () => true,
            isVisible: widget => widget?.id === VesEmulatorSidebarWidget.ID,
            execute: () => this.commandService.executeCommand(VesCoreCommands.OPEN_DOCUMENTATION.id, 'basics/emulator', false),
        });
    }

    async registerToolbarItems(toolbar: TabBarToolbarRegistry): Promise<void> {
        toolbar.registerItem({
            id: VesEmulatorSidebarCommands.WIDGET_HELP.id,
            command: VesEmulatorSidebarCommands.WIDGET_HELP.id,
            tooltip: VesEmulatorSidebarCommands.WIDGET_HELP.label,
            priority: 2,
        });
    }
}
