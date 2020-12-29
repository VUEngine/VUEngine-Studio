import { VesProperty } from "../common/types";

export const VesRunEmulatorsCustomPreference: VesProperty = {
    id: "emulators.customEmulators",
    property: {
        type: "array",
        label: "Emulator Configurations",
        description: "Additional custom emulator configurations",
        items: {
            type: "object",
            title: "Emulator configs",
            properties: {
                name: {
                    type: "string",
                    description: "Name of the emulator configuration",
                    label: "Name",
                },
                path: {
                    type: "string",
                    description: "Full path to emulator",
                    label: "Path",
                },
                args: {
                    type: "string",
                    multiline: true,
                    description: "Arguments to pass to emulator",
                    label: "Arguments",
                },
            },
        },
        default: [],
    },
};

export const VesRunDefaultEmulatorPreference: VesProperty = {
    id: "emulators.defaultEmulator",
    property: {
        type: "string",
        label: "Default Emulator",
        description: "Default emulator to use. Use first in emulators list when empty.",
        default: ""
    }
};