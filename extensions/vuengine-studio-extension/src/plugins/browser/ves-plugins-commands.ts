import { Command } from '@theia/core';

export namespace VesPluginsCommands {
    export const CATEGORY = 'Plugins';

    export const NEW: Command = {
        id: 'ves:plugins:new',
        label: 'New Plugin',
        category: CATEGORY,
    };

    export const SHOW_INSTALLED: Command = {
        id: 'ves:plugins:showInstalled',
        label: 'Show Installed Plugins',
        category: CATEGORY,
    };

    export const SHOW_RECOMMENDATIONS: Command = {
        id: 'ves:plugins:showRecommendations',
        label: 'Show Recommended Plugins',
        category: CATEGORY,
    };

    export const SEARCH_BY_TAG: Command = {
        id: 'ves:plugins:searchByTag',
        label: 'Search By Tag',
        category: CATEGORY,
    };

    export const SEARCH_BY_AUTHOR: Command = {
        id: 'ves:plugins:searchByAuthor',
        label: 'Search By Author',
        category: CATEGORY,
    };
}
