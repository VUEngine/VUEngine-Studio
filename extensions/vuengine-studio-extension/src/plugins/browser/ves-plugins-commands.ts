import { Command } from '@theia/core';

export namespace VesPluginsCommands {
    export const NEW: Command = Command.toLocalizedCommand(
        {
            id: 'plugins.new',
            label: 'New Plugin',
            category: 'Plugins',
        },
        'vuengine/plugins/commands/new',
        'vuengine/plugins/commands/category'
    );

    export const SHOW_TAGS: Command = Command.toLocalizedCommand(
        {
            id: 'plugins.showTags',
            label: 'Show Plugin Tags',
            category: 'Plugins',
        },
        'vuengine/plugins/commands/showTags',
        'vuengine/plugins/commands/category'
    );

    export const SHOW_INSTALLED: Command = Command.toLocalizedCommand(
        {
            id: 'plugins.showInstalled',
            label: 'Show Installed Plugins',
            category: 'Plugins',
        },
        'vuengine/plugins/commands/showInstalled',
        'vuengine/plugins/commands/category'
    );

    export const SHOW_RECOMMENDATIONS: Command = Command.toLocalizedCommand(
        {
            id: 'plugins.showRecommendations',
            label: 'Show Recommended Plugins',
            category: 'Plugins',
        },
        'vuengine/plugins/commands/showRecommendations',
        'vuengine/plugins/commands/category'
    );

    export const SEARCH_BY_TAG: Command = Command.toLocalizedCommand(
        {
            id: 'plugins.searchByTag',
            label: 'Search By Tag',
            category: 'Plugins',
        },
        'vuengine/plugins/commands/searchByTag',
        'vuengine/plugins/commands/category'
    );

    export const SEARCH_BY_AUTHOR: Command = Command.toLocalizedCommand(
        {
            id: 'plugins.searchByAuthor',
            label: 'Search By Author',
            category: 'Plugins',
        },
        'vuengine/plugins/commands/searchByAuthor',
        'vuengine/plugins/commands/category'
    );


    export const WIDGET_TOGGLE: Command = Command.toLocalizedCommand(
        {
            id: 'plugins.toggleView',
            label: 'Toggle Plugins View',
        },
        'vuengine/plugins/commands/toggleView',
        'vuengine/plugins/commands/category'
    );

    export const WIDGET_CLEAR_ALL: Command = Command.toLocalizedCommand(
        {
            id: 'plugins.clearAll',
            label: 'Clear Search Results',
            iconClass: 'codicon codicon-clear-all',
            category: 'Plugins',
        },
        'vuengine/plugins/commands/clearAll',
        'vuengine/plugins/commands/category'
    );

    export const WIDGET_HELP: Command = Command.toLocalizedCommand(
        {
            id: 'plugins.showHelp',
            label: 'Show Handbook Page',
            iconClass: 'codicon codicon-book',
            category: 'Plugins',
        },
        'vuengine/plugins/commands/showHelp',
        'vuengine/plugins/commands/category'
    );

    export const WIDGET_SETTINGS: Command = Command.toLocalizedCommand(
        {
            id: 'plugins.showSettings',
            label: 'Show Plugins Preferences',
            iconClass: 'codicon codicon-settings',
            category: 'Plugins',
        },
        'vuengine/plugins/commands/showSettings',
        'vuengine/plugins/commands/category'
    );
}
