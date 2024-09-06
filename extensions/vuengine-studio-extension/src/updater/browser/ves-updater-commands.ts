import { Command } from '@theia/core';

export namespace VesUpdaterCommands {
    export const CHECK_FOR_UPDATES: Command = Command.toLocalizedCommand(
        {
            id: 'updater.checkForUpdates',
            label: 'Check for Updates...',
            category: 'Updater',
        },
        'vuengine/updater/commands/checkForUpdates',
        'vuengine/updater/commands/category'
    );
}
