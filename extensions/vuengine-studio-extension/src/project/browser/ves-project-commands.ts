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
            id: 'project.toggleDashboardView',
            label: 'Toggle Project Dashboard View',
        },
        'vuengine/projects/commands/toggleView'
    );

    export const UPDATE_FILES: Command = Command.toLocalizedCommand(
        {
            id: 'project.updateFiles',
            label: 'Update item files',
        },
        'vuengine/projects/commands/updateFiles'
    );
}
