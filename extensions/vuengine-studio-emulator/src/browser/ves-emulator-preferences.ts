import { PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';

import { EmulationMode, EmulatorScale, StereoMode } from './ves-emulator-types';

export namespace VesEmulatorPreferenceIds {
    export const CATEGORY = 'emulator';

    export const EMULATORS = [CATEGORY, 'custom', 'configs'].join('.');
    export const DEFAULT_EMULATOR = [CATEGORY, 'custom', 'default'].join('.');
    export const EMULATOR_STEREO_MODE = [CATEGORY, 'builtIn', 'stereoMode'].join('.');
    export const EMULATOR_EMULATION_MODE = [CATEGORY, 'builtIn', 'emulationMode'].join('.');
    export const EMULATOR_SCALE = [CATEGORY, 'builtIn', 'scale'].join('.');
}

export const VesEmulatorPreferenceSchema: PreferenceSchema = {
    'type': 'object',
    'properties': {
        [VesEmulatorPreferenceIds.EMULATORS]: {
            type: 'array',
            label: 'Custom Emulator Configurations',
            description: 'User-defined emulator configurations for running compiled ROMs.',
            items: {
                type: 'object',
                title: 'Emulator configs',
                properties: {
                    name: {
                        type: 'string',
                        description: 'Name of the emulator configuration.',
                        label: 'Name',
                    },
                    path: {
                        type: 'string',
                        description: 'Full path to emulator.',
                        label: 'Path',
                    },
                    args: {
                        type: 'string',
                        multiline: true,
                        description: 'Arguments to pass to emulator. You can use the placeholder %ROM% for the project\'s output ROM image path.',
                        label: 'Arguments',
                    },
                },
            },
            default: [],
        },
        [VesEmulatorPreferenceIds.DEFAULT_EMULATOR]: {
            type: 'string',
            label: 'Default Emulator',
            description: 'Emulator configuration that shall be used to run compiled ROMs. Uses built-in emulator if left blank.',
            default: '',
        },
        [VesEmulatorPreferenceIds.EMULATOR_STEREO_MODE]: {
            type: 'string',
            label: 'Stereo Mode',
            description: 'Stereoscopy display mode of built-in emulator.',
            enum: Object.keys(StereoMode),
            /* enumDescriptions: Object.values(StereoMode), */
            default: Object.keys(StereoMode)[0],
        },
        [VesEmulatorPreferenceIds.EMULATOR_EMULATION_MODE]: {
            type: 'string',
            label: 'Emulation Mode',
            description: 'Emulation mode of built-in emulator.',
            enum: Object.keys(EmulationMode),
            /* enumDescriptions: Object.values(EmulationMode), */
            default: Object.keys(EmulationMode)[0],
        },
        [VesEmulatorPreferenceIds.EMULATOR_SCALE]: {
            type: 'string',
            label: 'Scale',
            description: 'Scaling mode of built-in emulator.',
            enum: Object.keys(EmulatorScale),
            /* enumDescriptions: Object.values(EmulatorScale), */
            default: Object.keys(EmulatorScale)[0],
        },
    },
};
