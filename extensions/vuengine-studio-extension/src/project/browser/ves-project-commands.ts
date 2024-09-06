import { Command } from '@theia/core';

export namespace VesProjectCommands {
    export const NEW: Command = Command.toLocalizedCommand(
        {
            id: 'project.new',
            label: 'Create New Project',
            iconClass: 'codicon codicon-add'
        },
        'vuengine/projects/commands/createNewProject'
    );

    export const TOGGLE_WIDGET: Command = Command.toLocalizedCommand(
        {
            id: 'project.toggleView',
            label: 'Toggle Project View',
        },
        'vuengine/projects/commands/toggleView'
    );
}
