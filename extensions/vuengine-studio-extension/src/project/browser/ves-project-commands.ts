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

    export const WIDGET_TOGGLE: Command = Command.toLocalizedCommand(
        {
            id: 'project.toggleView',
            label: 'Toggle Project Dashboard View',
        },
        'vuengine/projects/commands/toggleView'
    );
}
