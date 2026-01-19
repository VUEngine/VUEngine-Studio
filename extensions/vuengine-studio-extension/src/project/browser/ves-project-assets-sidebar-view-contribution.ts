import { Command, CommandContribution, CommandRegistry, CommandService, MenuModelRegistry } from '@theia/core';
import { AbstractViewContribution, CommonMenus, FrontendApplication, KeybindingRegistry } from '@theia/core/lib/browser';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesProjectAssetsSidebarWidget } from './ves-project-assets-sidebar-widget';

export namespace VesProjectAssetsSidebarCommands {
    export const WIDGET_TOGGLE: Command = Command.toLocalizedCommand(
        {
            id: 'assetsSidebar.toggleView',
            label: 'Toggle Assets View',
        },
        'vuengine/projects/assetsSidebar/commands/toggleView',
        'vuengine/projects/assetsSidebar/commands/category'
    );
    export const EXPAND_ALL: Command = Command.toLocalizedCommand(
        {
            id: 'assetsSidebar.expandAll',
            label: 'Expand All',
            iconClass: 'codicon codicon-expand-all',
        },
        'vuengine/projects/assetsSidebar/commands/expandAll',
        'vuengine/projects/assetsSidebar/commands/category'
    );
    export const COLLAPSE_ALL: Command = Command.toLocalizedCommand(
        {
            id: 'assetsSidebar.collapseAll',
            label: 'Collapse All',
            iconClass: 'codicon codicon-collapse-all',
        },
        'vuengine/projects/assetsSidebar/commands/collapseAll',
        'vuengine/projects/assetsSidebar/commands/category'
    );
};

@injectable()
export class VesProjectAssetsSidebarViewContribution extends AbstractViewContribution<VesProjectAssetsSidebarWidget> implements CommandContribution, TabBarToolbarContribution {
    @inject(CommandService)
    protected readonly commandService: CommandService;

    constructor() {
        super({
            widgetId: VesProjectAssetsSidebarWidget.ID,
            widgetName: VesProjectAssetsSidebarWidget.LABEL,
            defaultWidgetOptions: {
                area: 'left',
                rank: -10000,
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: false, reveal: false });
    }

    async registerCommands(commandRegistry: CommandRegistry): Promise<void> {
        super.registerCommands(commandRegistry);

        commandRegistry.registerCommand(VesProjectAssetsSidebarCommands.WIDGET_TOGGLE, {
            execute: () => this.toggleView()
        });
        commandRegistry.registerCommand(VesProjectAssetsSidebarCommands.EXPAND_ALL, {
            isEnabled: () => this.shell.currentWidget instanceof VesProjectAssetsSidebarWidget,
            isVisible: () => this.shell.currentWidget instanceof VesProjectAssetsSidebarWidget,
            execute: () => (this.shell.currentWidget as VesProjectAssetsSidebarWidget).setAllExpanded(true),
        });
        commandRegistry.registerCommand(VesProjectAssetsSidebarCommands.COLLAPSE_ALL, {
            isEnabled: () => this.shell.currentWidget instanceof VesProjectAssetsSidebarWidget,
            isVisible: () => this.shell.currentWidget instanceof VesProjectAssetsSidebarWidget,
            execute: () => (this.shell.currentWidget as VesProjectAssetsSidebarWidget).setAllExpanded(false),
        });
    }

    async registerMenus(menus: MenuModelRegistry): Promise<void> {
        super.registerMenus(menus);

        menus.registerMenuAction(CommonMenus.VIEW_VIEWS, {
            commandId: VesProjectAssetsSidebarCommands.WIDGET_TOGGLE.id,
            label: this.viewLabel
        });
    }

    async registerKeybindings(keybindings: KeybindingRegistry): Promise<void> {
        super.registerKeybindings(keybindings);

        keybindings.registerKeybinding({
            command: VesProjectAssetsSidebarCommands.WIDGET_TOGGLE.id,
            keybinding: 'ctrlcmd+shift+a'
        });
    }

    registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
        toolbar.registerItem({
            id: VesProjectAssetsSidebarCommands.COLLAPSE_ALL.id,
            command: VesProjectAssetsSidebarCommands.COLLAPSE_ALL.id,
            tooltip: VesProjectAssetsSidebarCommands.COLLAPSE_ALL.label,
            priority: 0,
        });
        toolbar.registerItem({
            id: VesProjectAssetsSidebarCommands.EXPAND_ALL.id,
            command: VesProjectAssetsSidebarCommands.EXPAND_ALL.id,
            tooltip: VesProjectAssetsSidebarCommands.EXPAND_ALL.label,
            priority: 1,
        });
    }
}
