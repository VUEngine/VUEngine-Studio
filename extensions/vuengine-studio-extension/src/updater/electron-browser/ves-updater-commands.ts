import { Command } from '@theia/core';

export namespace VesUpdaterCommands {
    export const CHECK_FOR_UPDATES: Command = Command.toLocalizedCommand(
        {
            id: 'ves:updater:checkForUpdates',
            label: 'Check for Updates...',
            category: 'Updater',
        },
        'vuengine/updater/commands/checkForUpdates',
        'vuengine/updater/commands/category'
    );

    export const RESTART_TO_UPDATE: Command = Command.toLocalizedCommand(
        {
            id: 'ves:updater:restartToUpdate',
            label: 'Restart to Update',
            category: 'Updater',
        },
        'vuengine/updater/commands/restartToUpdate',
        'vuengine/updater/commands/category'
    );
}
