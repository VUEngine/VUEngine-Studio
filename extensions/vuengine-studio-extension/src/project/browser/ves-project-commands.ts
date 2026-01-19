import { Command } from '@theia/core';

export namespace VesProjectCommands {
    export const NEW: Command = Command.toLocalizedCommand(
        {
            id: 'project.new',
            label: 'Create New Project',
            iconClass: 'codicon codicon-add',
            category: 'Project',
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

    export const DASHBOARD_SHOW: Command = Command.toLocalizedCommand(
        {
            id: 'project.showDashboardView',
            label: 'Show Stages Dashboard',
            iconClass: 'codicon codicon-compass',
            category: 'Project',
        },
        'vuengine/projects/commands/showStagesDashboard',
        'vuengine/projects/commands/dashboard/category',
    );

    export const ZOOM_IN: Command = Command.toLocalizedCommand(
        {
            id: 'project.dashboard.zoomIn',
            label: 'Zoom In',
            category: 'Stages Dashboard',
        },
        'vuengine/projects/commands/dashboard/zoomIn',
        'vuengine/projects/commands/dashboard/category',
    );

    export const ZOOM_OUT: Command = Command.toLocalizedCommand(
        {
            id: 'project.dashboard.zoomOut',
            label: 'Zoom Out',
            category: 'Stages Dashboard',
        },
        'vuengine/projects/commands/dashboard/zoomOut',
        'vuengine/projects/commands/dashboard/category',
    );

    export const ZOOM_RESET: Command = Command.toLocalizedCommand(
        {
            id: 'project.dashboard.zoomReset',
            label: 'Reset Zoom',
            category: 'Stages Dashboard',
        },
        'vuengine/projects/commands/dashboard/zoomReset',
        'vuengine/projects/commands/dashboard/category',
    );
}
