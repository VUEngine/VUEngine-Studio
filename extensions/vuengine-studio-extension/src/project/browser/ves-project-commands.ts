import { Command } from '@theia/core';

export namespace VesProjectCommands {
    export const NEW: Command = Command.toLocalizedCommand(
        {
            id: 'ves:project:new',
            label: 'New Project',
            category: 'Projects',
        },
        'vuengine/project/commands/newProject',
        'vuengine/project/commands/category'
    );

    export const TOGGLE_WIDGET: Command = Command.toLocalizedCommand(
        {
            id: 'ves:project:toggleView',
            label: 'Toggle Project View',
            category: 'Projects',
        },
        'vuengine/project/commands/toggleView',
        'vuengine/project/commands/category'
    );
}
