import { Command } from '@theia/core';

export namespace VesPluginsCommands {
    export const CATEGORY = 'VUEngine Plugins';

    export const NEW: Command = {
        id: 'ves:plugins:new',
        label: 'New Plugin',
        category: CATEGORY,
    };
}
