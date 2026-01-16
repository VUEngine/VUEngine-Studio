import { Command, CommandContribution, CommandRegistry, CommandService, MenuModelRegistry } from '@theia/core';
import { AbstractViewContribution, CommonMenus, FrontendApplication, KeybindingRegistry } from '@theia/core/lib/browser';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesProjectSidebarWidget } from './ves-project-sidebar-widget';

export namespace VesProjectSidebarCommands {
    export const WIDGET_TOGGLE: Command = Command.toLocalizedCommand(
        {
            id: 'projectSidebar.toggleView',
            label: 'Toggle Project View',
        },
        'vuengine/projects/sidebar/commands/toggleView',
        'vuengine/projects/sidebar/commands/category'
    );
    export const EXPAND_ALL: Command = Command.toLocalizedCommand(
        {
            id: 'projectSidebar.expandAll',
            label: 'Expand All',
            iconClass: 'codicon codicon-expand-all',
        },
        'vuengine/projects/sidebar/commands/expandAll',
        'vuengine/projects/sidebar/commands/category'
    );
    export const COLLAPSE_ALL: Command = Command.toLocalizedCommand(
        {
            id: 'projectSidebar.collapseAll',
            label: 'Collapse All',
            iconClass: 'codicon codicon-collapse-all',
        },
        'vuengine/projects/sidebar/commands/collapseAll',
        'vuengine/projects/sidebar/commands/category'
    );
};

@injectable()
export class VesProjectSidebarViewContribution extends AbstractViewContribution<VesProjectSidebarWidget> implements CommandContribution, TabBarToolbarContribution {
    @inject(CommandService)
    protected readonly commandService: CommandService;

    constructor() {
        super({
            widgetId: VesProjectSidebarWidget.ID,
            widgetName: VesProjectSidebarWidget.LABEL,
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

        commandRegistry.registerCommand(VesProjectSidebarCommands.WIDGET_TOGGLE, {
            execute: () => this.toggleView()
        });
        commandRegistry.registerCommand(VesProjectSidebarCommands.EXPAND_ALL, {
            isEnabled: () => this.shell.currentWidget instanceof VesProjectSidebarWidget &&
                this.shell.currentWidget.tabIndex === 0,
            isVisible: () => this.shell.currentWidget instanceof VesProjectSidebarWidget &&
                this.shell.currentWidget.tabIndex === 0,
            execute: () => (this.shell.currentWidget as VesProjectSidebarWidget).setAllExpanded(true),
        });
        commandRegistry.registerCommand(VesProjectSidebarCommands.COLLAPSE_ALL, {
            isEnabled: () => this.shell.currentWidget instanceof VesProjectSidebarWidget &&
                this.shell.currentWidget.tabIndex === 0,
            isVisible: () => this.shell.currentWidget instanceof VesProjectSidebarWidget &&
                this.shell.currentWidget.tabIndex === 0,
            execute: () => (this.shell.currentWidget as VesProjectSidebarWidget).setAllExpanded(false),
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

    registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
        toolbar.registerItem({
            id: VesProjectSidebarCommands.EXPAND_ALL.id,
            command: VesProjectSidebarCommands.EXPAND_ALL.id,
            tooltip: VesProjectSidebarCommands.EXPAND_ALL.label,
            priority: 0,
        });
        toolbar.registerItem({
            id: VesProjectSidebarCommands.COLLAPSE_ALL.id,
            command: VesProjectSidebarCommands.COLLAPSE_ALL.id,
            tooltip: VesProjectSidebarCommands.COLLAPSE_ALL.label,
            priority: 1,
        });
    }
}
