import { Command } from '@theia/core';

export namespace VesProjectCommands {
    export const NEW: Command = Command.toLocalizedCommand(
        {
            id: 'ves:project:new',
            label: 'New Project',
            iconClass: 'codicon codicon-add'
        },
        'vuengine/projects/commands/newProject'
    );

    export const TOGGLE_WIDGET: Command = Command.toLocalizedCommand(
        {
            id: 'ves:project:toggleView',
            label: 'Toggle Project View',
        },
        'vuengine/projects/commands/toggleView'
    );
}
