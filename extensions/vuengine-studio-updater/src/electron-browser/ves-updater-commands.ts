import { Command } from '@theia/core';

export namespace VesUpdaterCommands {
    const category = 'VUEngine Studio';

    export const CHECK_FOR_UPDATES: Command = {
        id: 'electron-ves:check-for-updates',
        label: 'Check for Updates...',
        category
    };

    export const RESTART_TO_UPDATE: Command = {
        id: 'electron-ves:restart-to-update',
        label: 'Restart to Update',
        category
    };
}