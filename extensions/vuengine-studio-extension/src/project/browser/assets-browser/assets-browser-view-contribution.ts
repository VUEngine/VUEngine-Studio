import { Command, CommandContribution, CommandRegistry, CommandService } from '@theia/core';
import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { inject, injectable } from '@theia/core/shared/inversify';
import { AssetsBrowserWidget } from './assets-browser-widget';

export namespace AssetsBrowserCommands {
    export const WIDGET_TOGGLE: Command = Command.toLocalizedCommand(
        {
            id: 'assetsBrowser.toggleView',
            label: 'Toggle Asset Browser',
        },
        'vuengine/projects/assetsBrowser/commands/toggleView',
        'vuengine/projects/assetsBrowser/commands/category'
    );
    export const ADD: Command = Command.toLocalizedCommand(
        {
            id: 'assetsBrowser.add',
            label: 'Add',
            iconClass: 'codicon codicon-add',
        },
        'vuengine/projects/assetsBrowser/commands/Add',
        'vuengine/projects/assetsBrowser/commands/category'
    );
    export const REFRESH: Command = Command.toLocalizedCommand(
        {
            id: 'assetsBrowser.refresh',
            label: 'Refresh',
            iconClass: 'codicon codicon-refresh',
        },
        'vuengine/projects/assetsBrowser/commands/refresh',
        'vuengine/projects/assetsBrowser/commands/category'
    );
    export const EXPAND_ALL: Command = Command.toLocalizedCommand(
        {
            id: 'assetsBrowser.expandAll',
            label: 'Expand All',
            iconClass: 'codicon codicon-expand-all',
        },
        'vuengine/projects/assetsBrowser/commands/expandAll',
        'vuengine/projects/assetsBrowser/commands/category'
    );
    export const COLLAPSE_ALL: Command = Command.toLocalizedCommand(
        {
            id: 'assetsBrowser.collapseAll',
            label: 'Collapse All',
            iconClass: 'codicon codicon-collapse-all',
        },
        'vuengine/projects/assetsBrowser/commands/collapseAll',
        'vuengine/projects/assetsBrowser/commands/category'
    );
};

@injectable()
export class AssetsBrowserViewContribution extends AbstractViewContribution<AssetsBrowserWidget> implements CommandContribution, TabBarToolbarContribution {
    @inject(CommandService)
    protected readonly commandService: CommandService;
    constructor() {
        super({
            widgetId: AssetsBrowserWidget.ID,
            widgetName: AssetsBrowserWidget.LABEL,
            defaultWidgetOptions: {
                area: 'left',
                rank: -10000,
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
    }

    async registerCommands(commandRegistry: CommandRegistry): Promise<void> {
        super.registerCommands(commandRegistry);

        commandRegistry.registerCommand(AssetsBrowserCommands.WIDGET_TOGGLE, {
            execute: () => this.toggleView()
        });
        commandRegistry.registerCommand(AssetsBrowserCommands.ADD, {
            isEnabled: () => this.shell.currentWidget instanceof AssetsBrowserWidget,
            isVisible: () => this.shell.currentWidget instanceof AssetsBrowserWidget,
            execute: () => (this.shell.currentWidget as AssetsBrowserWidget).add(),
        });
        commandRegistry.registerCommand(AssetsBrowserCommands.REFRESH, {
            isEnabled: () => this.shell.currentWidget instanceof AssetsBrowserWidget,
            isVisible: () => this.shell.currentWidget instanceof AssetsBrowserWidget,
            execute: () => (this.shell.currentWidget as AssetsBrowserWidget).refresh(),
        });
        commandRegistry.registerCommand(AssetsBrowserCommands.EXPAND_ALL, {
            isEnabled: () => this.shell.currentWidget instanceof AssetsBrowserWidget,
            isVisible: () => this.shell.currentWidget instanceof AssetsBrowserWidget,
            execute: () => (this.shell.currentWidget as AssetsBrowserWidget).setAllExpanded(true),
        });
        commandRegistry.registerCommand(AssetsBrowserCommands.COLLAPSE_ALL, {
            isEnabled: () => this.shell.currentWidget instanceof AssetsBrowserWidget,
            isVisible: () => this.shell.currentWidget instanceof AssetsBrowserWidget,
            execute: () => (this.shell.currentWidget as AssetsBrowserWidget).setAllExpanded(false),
        });
    }

    registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
        toolbar.registerItem({
            id: AssetsBrowserCommands.ADD.id,
            command: AssetsBrowserCommands.ADD.id,
            tooltip: AssetsBrowserCommands.ADD.label,
            priority: 0,
        });
        toolbar.registerItem({
            id: AssetsBrowserCommands.REFRESH.id,
            command: AssetsBrowserCommands.REFRESH.id,
            tooltip: AssetsBrowserCommands.REFRESH.label,
            priority: 1,
        });
        toolbar.registerItem({
            id: AssetsBrowserCommands.COLLAPSE_ALL.id,
            command: AssetsBrowserCommands.COLLAPSE_ALL.id,
            tooltip: AssetsBrowserCommands.COLLAPSE_ALL.label,
            priority: 2,
        });
        toolbar.registerItem({
            id: AssetsBrowserCommands.EXPAND_ALL.id,
            command: AssetsBrowserCommands.EXPAND_ALL.id,
            tooltip: AssetsBrowserCommands.EXPAND_ALL.label,
            priority: 3,
        });
    }
}
