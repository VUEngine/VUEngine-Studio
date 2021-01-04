import { Command } from "@theia/core";

export namespace VesZoomCommands {
    // this reuses/overrides the built-in IDs to keep menu entries etc
    export const ZOOM_IN: Command = {
        id: 'view.zoomIn',
        label: 'Zoom In',
        category: 'View',
    };
    export const ZOOM_OUT: Command = {
        id: 'view.zoomOut',
        label: 'Zoom Out',
        category: 'View',
    };
    export const RESET_ZOOM: Command = {
        id: 'view.resetZoom',
        label: 'Reset Zoom',
        category: 'View',
    };
};