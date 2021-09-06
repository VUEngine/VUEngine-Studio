import { Command } from '@theia/core';

export namespace VesZoomCommands {
    export const CATEGORY = 'View';

    // this reuses/overrides the built-in IDs to keep menu entries etc
    export const ZOOM_IN: Command = {
        id: 'view.zoomIn',
        category: CATEGORY,
        label: 'Zoom In',
    };
    export const ZOOM_OUT: Command = {
        id: 'view.zoomOut',
        category: CATEGORY,
        label: 'Zoom Out',
    };
    export const RESET_ZOOM: Command = {
        id: 'view.resetZoom',
        category: CATEGORY,
        label: 'Reset Zoom',
    };
};
