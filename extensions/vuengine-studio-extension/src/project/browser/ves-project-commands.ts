import { Command } from '@theia/core';

export namespace VesProjectCommands {
    export const NEW: Command = Command.toLocalizedCommand(
        {
            id: 'project.new',
            label: 'Create New Project',
            iconClass: 'codicon codicon-add',
        },
        'vuengine/projects/commands/createNewProject',
    );

    export const UPDATE_FILES: Command = Command.toLocalizedCommand(
        {
            id: 'project.updateFiles',
            label: 'Update item files',
            category: 'Project',
        },
        'vuengine/projects/commands/updateFiles',
        'vuengine/projects/commands/category',
    );

    export const WIDGET_TOGGLE: Command = Command.toLocalizedCommand(
        {
            id: 'project.toggleDashboardView',
            label: 'Toggle Project Dashboard View',
            category: 'Project Dashboard',
        },
        'vuengine/projects/commands/toggleView',
        'vuengine/projects/commands/dashboard/category',
    );

    export const ZOOM_IN: Command = Command.toLocalizedCommand(
        {
            id: 'project.dashboard.zoomIn',
            label: 'Zoom In',
            category: 'Project Dashboard',
        },
        'vuengine/projects/commands/dashboard/zoomIn',
        'vuengine/projects/commands/dashboard/category',
    );

    export const ZOOM_OUT: Command = Command.toLocalizedCommand(
        {
            id: 'project.dashboard.zoomOut',
            label: 'Zoom Out',
            category: 'Project Dashboard',
        },
        'vuengine/projects/commands/dashboard/zoomOut',
        'vuengine/projects/commands/dashboard/category',
    );

    export const ZOOM_RESET: Command = Command.toLocalizedCommand(
        {
            id: 'project.dashboard.zoomReset',
            label: 'Reset Zoom',
            category: 'Project Dashboard',
        },
        'vuengine/projects/commands/dashboard/zoomReset',
        'vuengine/projects/commands/dashboard/category',
    );
}
