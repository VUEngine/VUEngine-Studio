import { VesProperty } from "../common/common-types";
import { EmulationMode, EmulatorScale, StereoMode } from "./emulator-types";

export namespace VesEmulatorPrefs {
    export const EMULATORS: VesProperty = {
        id: "emulator.custom.configs",
        property: {
            type: "array",
            label: "Custom Emulator Configurations",
            description: "User-defined emulator configurations for running compiled ROMs.",
            items: {
                type: "object",
                title: "Emulator configs",
                properties: {
                    name: {
                        type: "string",
                        description: "Name of the emulator configuration.",
                        label: "Name",
                    },
                    path: {
                        type: "string",
                        description: "Full path to emulator.",
                        label: "Path",
                    },
                    args: {
                        type: "string",
                        multiline: true,
                        description: "Arguments to pass to emulator. You can use the placeholder %ROM% for the project's output ROM image path.",
                        label: "Arguments",
                    },
                },
            },
            default: [],
        },
    };

    export const DEFAULT_EMULATOR: VesProperty = {
        id: "emulator.custom.default",
        property: {
            type: "string",
            label: "Default Emulator",
            description: "Emulator configuration that shall be used to run compiled ROMs. Uses built-in emulator if left blank.",
            default: ""
        }
    };

    export const EMULATOR_STEREO_MODE: VesProperty = {
        id: "emulator.builtIn.stereoMode",
        property: {
            type: "string",
            label: "Stereo Mode",
            description: "Stereoscopy display mode of built-in emulator.",
            enum: Object.keys(StereoMode),
            /*enumDescriptions: Object.values(StereoMode),*/
            default: Object.keys(StereoMode)[0],
        }
    };

    export const EMULATOR_EMULATION_MODE: VesProperty = {
        id: "emulator.builtIn.emulationMode",
        property: {
            type: "string",
            label: "Emulation Mode",
            description: "Emulation mode of built-in emulator.",
            enum: Object.keys(EmulationMode),
            /*enumDescriptions: Object.values(EmulationMode),*/
            default: Object.keys(EmulationMode)[0],
        }
    };

    export const EMULATOR_SCALE: VesProperty = {
        id: "emulator.builtIn.scale",
        property: {
            type: "string",
            label: "Scale",
            description: "Scaling mode of built-in emulator.",
            enum: Object.keys(EmulatorScale),
            /*enumDescriptions: Object.values(EmulatorScale),*/
            default: Object.keys(EmulatorScale)[0],
        }
    };
};