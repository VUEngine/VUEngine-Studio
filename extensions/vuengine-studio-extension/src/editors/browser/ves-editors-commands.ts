import { Command } from '@theia/core';

export namespace VesEditorsCommands {
    export const WIDGET_OPEN: Command = Command.toLocalizedCommand(
        {
            id: 'ves:editors:open',
            label: 'Open',
            category: 'Editor',
        },
        'vuengine/editors/commands/open',
        'vuengine/editors/commands/category'
    );

    export const WIDGET_HELP: Command = Command.toLocalizedCommand(
        {
            id: 'ves:editors:showHelp',
            label: 'Show Handbook Page',
            category: 'Editor',
            iconClass: 'codicon codicon-book',
        },
        'vuengine/editors/showHelp',
        'vuengine/editors/commands/category'
    );
};
