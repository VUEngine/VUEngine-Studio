import { Command } from '@theia/core';

export namespace VesZoomCommands {
    // this reuses/overrides the built-in IDs to keep menu entries etc
    export const ZOOM_IN: Command = Command.toLocalizedCommand(
        {
            id: 'view.zoomIn',
            label: 'Zoom In',
            category: 'View',
        },
        'vuengine/zoom/commands/zoomIn',
        'vuengine/zoom/commands/category'
    );
    export const ZOOM_OUT: Command = Command.toLocalizedCommand(
        {
            id: 'view.zoomOut',
            label: 'Zoom Out',
            category: 'View',
        },
        'vuengine/zoom/commands/zoomOut',
        'vuengine/zoom/commands/category'
    );
    export const RESET_ZOOM: Command = Command.toLocalizedCommand(
        {
            id: 'view.resetZoom',
            label: 'Reset Zoom',
            category: 'View',
        },
        'vuengine/zoom/commands/resetZoom',
        'vuengine/zoom/commands/category'
    );
};
