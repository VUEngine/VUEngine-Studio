import { PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';

export namespace VesZoomPreferenceIds {
    export const CATEGORY = 'window';

    // TODO: unregister window.zoomLevel preference, then rename this
    // https://github.com/eclipse-theia/theia/discussions/9144
    export const ZOOM_LEVEL = [CATEGORY, 'zoomLevel2'].join('.');
    export const SHOW_STATUS_BAR_ENTRY = [CATEGORY, 'showZoomStatusBarEntry'].join('.');
}

export const VesZoomPreferenceSchema: PreferenceSchema = {
    'type': 'object',
    'properties': {
        [VesZoomPreferenceIds.ZOOM_LEVEL]: {
            type: 'string',
            label: 'Zoom Factor',
            description: 'Adjust the zoom level of the window.',
            enum: [
                // '30%',
                // '50%',
                // '66%',
                '80%',
                '90%',
                '100%',
                '110%',
                '120%',
                '133%',
                '150%',
                '170%',
                '200%',
                // '240%',
                // '300%',
            ],
            default: '100%',
        },
        [VesZoomPreferenceIds.SHOW_STATUS_BAR_ENTRY]: {
            type: 'boolean',
            label: 'Status Bar Entry',
            description: 'Show zoom level in status bar.',
            default: false
        },
    },
};
