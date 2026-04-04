import { Command, CommandContribution, CommandRegistry, CommandService } from '@theia/core';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { inject, injectable } from '@theia/core/shared/inversify';
import { AssetsBrowserWidget } from './assets-browser-widget';
import { PROJECT_TYPES } from '../ves-project-data';

export namespace AssetsBrowserCommands {
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
export class AssetsBrowserViewContribution implements CommandContribution, TabBarToolbarContribution {
    @inject(CommandService)
    protected readonly commandService: CommandService;

    async registerCommands(commandRegistry: CommandRegistry): Promise<void> {
        commandRegistry.registerCommand(AssetsBrowserCommands.ADD, {
            isEnabled: widget => widget instanceof AssetsBrowserWidget && PROJECT_TYPES[widget.id.split(':')[1]].enabled !== false,
            isVisible: widget => widget instanceof AssetsBrowserWidget,
            execute: widget => (widget as AssetsBrowserWidget).add(),
        });
        commandRegistry.registerCommand(AssetsBrowserCommands.REFRESH, {
            isEnabled: widget => widget instanceof AssetsBrowserWidget,
            isVisible: widget => widget instanceof AssetsBrowserWidget,
            execute: widget => (widget as AssetsBrowserWidget).refresh(),
        });
        commandRegistry.registerCommand(AssetsBrowserCommands.EXPAND_ALL, {
            isEnabled: widget => widget instanceof AssetsBrowserWidget,
            isVisible: widget => widget instanceof AssetsBrowserWidget,
            execute: widget => (widget as AssetsBrowserWidget).setAllExpanded(true),
        });
        commandRegistry.registerCommand(AssetsBrowserCommands.COLLAPSE_ALL, {
            isEnabled: widget => widget instanceof AssetsBrowserWidget,
            isVisible: widget => widget instanceof AssetsBrowserWidget,
            execute: widget => (widget as AssetsBrowserWidget).setAllExpanded(false),
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
