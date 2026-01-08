import { Command, CommandRegistry, CommandService, MenuModelRegistry } from '@theia/core';
import { AbstractViewContribution, CommonCommands, CommonMenus, FrontendApplication, KeybindingRegistry } from '@theia/core/lib/browser';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesCoreCommands } from '../../core/browser/ves-core-commands';
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

    export const WIDGET_EXPAND: Command = Command.toLocalizedCommand(
        {
            id: 'emulatorSidebar.expandView',
            label: 'Toggle Maximized',
            iconClass: 'codicon codicon-arrow-both',
        },
        'vuengine/emulator/sidebar/commands/expandView',
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

    constructor() {
        super({
            widgetId: VesEmulatorSidebarWidget.ID,
            widgetName: VesEmulatorSidebarWidget.LABEL,
            defaultWidgetOptions: {
                area: 'right',
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
            execute: () => this.toggleView()
        });

        commandRegistry.registerCommand(VesEmulatorSidebarCommands.WIDGET_EXPAND, {
            isEnabled: () => true,
            isVisible: widget => widget?.id === VesEmulatorSidebarWidget.ID,
            execute: async widget => widget?.id === VesEmulatorSidebarWidget.ID &&
                await this.openView({ activate: true, reveal: true }) &&
                this.commandService.executeCommand(CommonCommands.TOGGLE_MAXIMIZED.id)
        });

        commandRegistry.registerCommand(VesEmulatorSidebarCommands.WIDGET_HELP, {
            isEnabled: () => true,
            isVisible: widget => widget?.id === VesEmulatorSidebarWidget.ID,
            execute: () => this.commandService.executeCommand(VesCoreCommands.OPEN_DOCUMENTATION.id, 'basics/emulator', false),
        });
    }

    async registerToolbarItems(toolbar: TabBarToolbarRegistry): Promise<void> {
        toolbar.registerItem({
            id: VesEmulatorSidebarCommands.WIDGET_EXPAND.id,
            command: VesEmulatorSidebarCommands.WIDGET_EXPAND.id,
            tooltip: VesEmulatorSidebarCommands.WIDGET_EXPAND.label,
            priority: 1,
        });
        toolbar.registerItem({
            id: VesEmulatorSidebarCommands.WIDGET_HELP.id,
            command: VesEmulatorSidebarCommands.WIDGET_HELP.id,
            tooltip: VesEmulatorSidebarCommands.WIDGET_HELP.label,
            priority: 2,
        });
    }

    async registerMenus(menus: MenuModelRegistry): Promise<void> {
        super.registerMenus(menus);

        menus.registerMenuAction(CommonMenus.VIEW_VIEWS, {
            commandId: VesEmulatorSidebarCommands.WIDGET_TOGGLE.id,
            label: this.viewLabel
        });
    }

    async registerKeybindings(keybindings: KeybindingRegistry): Promise<void> {
        super.registerKeybindings(keybindings);

        keybindings.registerKeybinding({
            command: VesEmulatorSidebarCommands.WIDGET_TOGGLE.id,
            keybinding: 'ctrlcmd+shift+e'
        });
    }
}
