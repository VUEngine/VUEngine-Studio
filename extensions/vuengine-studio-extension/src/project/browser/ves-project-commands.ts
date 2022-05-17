import { Command } from '@theia/core';

export namespace VesProjectCommands {
    export const CATEGORY = 'Project';

    export const NEW: Command = {
        id: 'ves:project:new',
        label: 'New Project',
        category: CATEGORY,
    };
}
