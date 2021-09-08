import { Command } from '@theia/core';

export namespace VesProjectsCommands {
    export const CATEGORY = 'Projects';

    export const NEW: Command = {
        id: 'ves:projects:new',
        label: 'Create New Project',
        category: CATEGORY,
    };
}
