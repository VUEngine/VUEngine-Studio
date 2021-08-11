import { Command } from '@theia/core';

export namespace VesUpdaterCommands {
    const CATEGORY = 'VUEngine Studio';

    export const CHECK_FOR_UPDATES: Command = {
        id: 'electron-ves:check-for-updates',
        label: 'Check for Updates...',
        category: CATEGORY,
    };

    export const RESTART_TO_UPDATE: Command = {
        id: 'electron-ves:restart-to-update',
        label: 'Restart to Update',
        category: CATEGORY,
    };
}
