import { VesProperty } from "../common/types";

export const VesRunEmulatorsPreference: VesProperty = {
    id: "emulators.emulators",
    property: {
        type: "array",
        label: "Emulator Configurations",
        description: "Emulator configurations",
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
        default: [
            {
                name: "Mednafen (2D)",
                path: "%MEDNAFEN%",
                args:
                    "-'vb.3dmode' 'anaglyph' -'vb.anaglyph.preset' 'disabled' -'vb.anaglyph.lcolor' '0xff0000' -'vb.anaglyph.rcolor' '0x000000' -'vb.xscale' 2 -'vb.yscale' 2 %ROM%",
            },
            {
                name: "Mednafen (Anaglyph Red/Blue)",
                path: "%MEDNAFEN%",
                args:
                    "-'vb.3dmode' 'anaglyph' -'vb.anaglyph.preset' 'red_blue' -'vb.anaglyph.lcolor' '0xffba00' -'vb.anaglyph.rcolor' '0x00baff' -'vb.xscale' 2 -'vb.yscale' 2 %ROM%",
            },
        ],
    },
}