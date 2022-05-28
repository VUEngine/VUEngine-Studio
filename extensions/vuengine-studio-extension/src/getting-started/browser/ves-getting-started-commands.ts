import { Command } from '@theia/core';

export namespace VesGettingStartedCommands {
    export const WIDGET_SHOW: Command = Command.toLocalizedCommand(
        {
            id: 'ves:gettingStarted:showWidget',
            label: 'Getting Started',
        },
        'vuengine/gettingStarted/commands/showWidget',
        'vuengine/gettingStarted/commands/category'
    );

    export const HELP: Command = Command.toLocalizedCommand(
        {
            id: 'ves:gettingStarted:showHelp',
            label: 'Show Handbook Page',
            iconClass: 'codicon codicon-book',
        },
        'vuengine/gettingStarted/commands/showHelp',
        'vuengine/gettingStarted/commands/category'
    );
}
