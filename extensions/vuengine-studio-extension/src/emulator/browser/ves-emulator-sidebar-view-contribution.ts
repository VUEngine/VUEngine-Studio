import { Command, CommandRegistry, CommandService, MenuModelRegistry } from '@theia/core';
import { AbstractViewContribution, CommonCommands, CommonMenus, FrontendApplication, KeybindingRegistry } from '@theia/core/lib/browser';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { inject, injectable } from '@theia/core/shared/inversify';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesEmulatorSidebarWidget } from './ves-emulator-sidebar-widget';
import { VesCoreCommands } from '../../core/browser/ves-core-commands';

export namespace VesEmulatorSidebarCommands {
    export const WIDGET_TOGGLE: Command = Command.toLocalizedCommand(
        {
            id: 'ves:emulatorSidebar:toggleView',
            label: 'Toggle Emulator View',
        },
        'vuengine/emulator/sidebar/commands/toggleView',
        'vuengine/emulator/sidebar/commands/category'
    );

    export const WIDGET_EXPAND: Command = Command.toLocalizedCommand(
        {
            id: 'ves:emulatorSidebar:expandView',
            label: 'Toggle Maximized',
            iconClass: 'codicon codicon-arrow-both',
        },
        'vuengine/emulator/sidebar/commands/expandView',
        'vuengine/emulator/sidebar/commands/category'
    );

    export const WIDGET_HELP: Command = Command.toLocalizedCommand(
        {
            id: 'ves:emulatorSidebar:showHelp',
            label: 'Show Handbook Page',
            iconClass: 'codicon codicon-book',
        },
        'vuengine/emulator/sidebar/commands/showHelp',
        'vuengine/emulator/sidebar/commands/category'
    );

    export const WIDGET_SETTINGS: Command = Command.toLocalizedCommand(
        {
            id: 'ves:emulatorSidebar:showSettings',
            label: 'Show Flash Carts Preferences',
            iconClass: 'codicon codicon-settings',
        },
        'vuengine/emulator/sidebar/commands/showSettings',
        'vuengine/emulator/sidebar/commands/category'
    );
};

@injectable()
export class VesEmulatorSidebarViewContribution extends AbstractViewContribution<VesEmulatorSidebarWidget> implements TabBarToolbarContribution {
    @inject(CommandService)
    protected readonly commandService: CommandService;
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

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
        await this.workspaceService.ready;
        if (this.workspaceService.opened) {
            await this.openView({ activate: false, reveal: false });
        }
    }

    async registerCommands(commandRegistry: CommandRegistry): Promise<void> {
        super.registerCommands(commandRegistry);

        await this.workspaceService.ready;
        if (this.workspaceService.opened) {
            commandRegistry.registerCommand(VesEmulatorSidebarCommands.WIDGET_TOGGLE, {
                execute: () => this.toggleView()
            });

            commandRegistry.registerCommand(VesEmulatorSidebarCommands.WIDGET_EXPAND, {
                isEnabled: () => true,
                isVisible: widget => widget !== undefined &&
                    widget.id === VesEmulatorSidebarWidget.ID,
                execute: async widget => widget !== undefined &&
                    widget.id === VesEmulatorSidebarWidget.ID &&
                    await this.openView({ activate: true, reveal: true }) &&
                    this.commandService.executeCommand(CommonCommands.TOGGLE_MAXIMIZED.id)
            });

            commandRegistry.registerCommand(VesEmulatorSidebarCommands.WIDGET_HELP, {
                isEnabled: () => true,
                isVisible: widget => widget !== undefined &&
                    widget.id !== undefined &&
                    widget.id === VesEmulatorSidebarWidget.ID,
                execute: () => this.commandService.executeCommand(VesCoreCommands.OPEN_DOCUMENTATION.id, 'user-guide/emulator', false),
            });

            commandRegistry.registerCommand(VesEmulatorSidebarCommands.WIDGET_SETTINGS, {
                isEnabled: () => true,
                isVisible: widget => widget !== undefined &&
                    widget.id === VesEmulatorSidebarWidget.ID,
                execute: () => this.commandService.executeCommand(CommonCommands.OPEN_PREFERENCES.id, 'emulator'),
            });
        }
    }

    async registerToolbarItems(toolbar: TabBarToolbarRegistry): Promise<void> {
        await this.workspaceService.ready;
        if (this.workspaceService.opened) {
            toolbar.registerItem({
                id: VesEmulatorSidebarCommands.WIDGET_EXPAND.id,
                command: VesEmulatorSidebarCommands.WIDGET_EXPAND.id,
                tooltip: VesEmulatorSidebarCommands.WIDGET_EXPAND.label,
                priority: 1,
            });
            toolbar.registerItem({
                id: VesEmulatorSidebarCommands.WIDGET_SETTINGS.id,
                command: VesEmulatorSidebarCommands.WIDGET_SETTINGS.id,
                tooltip: VesEmulatorSidebarCommands.WIDGET_SETTINGS.label,
                priority: 2,
            });
            toolbar.registerItem({
                id: VesEmulatorSidebarCommands.WIDGET_HELP.id,
                command: VesEmulatorSidebarCommands.WIDGET_HELP.id,
                tooltip: VesEmulatorSidebarCommands.WIDGET_HELP.label,
                priority: 3,
            });
        }
    }

    async registerMenus(menus: MenuModelRegistry): Promise<void> {
        super.registerMenus(menus);

        await this.workspaceService.ready;
        if (this.workspaceService.opened) {
            menus.registerMenuAction(CommonMenus.VIEW_VIEWS, {
                commandId: VesEmulatorSidebarCommands.WIDGET_TOGGLE.id,
                label: this.viewLabel
            });
        }
    }

    async registerKeybindings(keybindings: KeybindingRegistry): Promise<void> {
        super.registerKeybindings(keybindings);

        await this.workspaceService.ready;
        if (this.workspaceService.opened) {
            keybindings.registerKeybinding({
                command: VesEmulatorSidebarCommands.WIDGET_TOGGLE.id,
                keybinding: 'ctrlcmd+shift+e'
            });
        }
    }
}
