import { VesProperty } from "../common/types";

export const VesRunEmulatorConfigsPreference: VesProperty = {
    id: "emulators.emulators",
    property: {
        type: "array",
        label: "Emulator Configurations",
        description: "Emulator Configurations",
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
                name: "2D",
                path: "%MEDNAFEN%",
                args: "-'vb.3dmode' 'anaglyph' -'vb.anaglyph.preset' 'disabled' -'vb.anaglyph.lcolor' '0xff0000' -'vb.anaglyph.rcolor' '0x000000' -'vb.xscale' 2 -'vb.yscale' 2 %ROM%",
            },
            {
                name: "Anaglyph Red/Blue",
                path: "%MEDNAFEN%",
                args: "-'vb.3dmode' 'anaglyph' -'vb.anaglyph.preset' 'red_blue' -'vb.anaglyph.lcolor' '0xffba00' -'vb.anaglyph.rcolor' '0x00baff' -'vb.xscale' 2 -'vb.yscale' 2 %ROM%",
            },
            {
                name: "Anaglyph Red/Cyan",
                path: "%MEDNAFEN%",
                args: "-'vb.3dmode' 'anaglyph' -'vb.anaglyph.preset' 'red_cyan' -'vb.anaglyph.lcolor' '0xffba00' -'vb.anaglyph.rcolor' '0x00baff' -'vb.xscale' 2 -'vb.yscale' 2 %ROM%",
            },
            {
                name: "Anaglyph Red/Electric Cyan",
                path: "%MEDNAFEN%",
                args: "-'vb.3dmode' 'anaglyph' -'vb.anaglyph.preset' 'red_electriccyan' -'vb.anaglyph.lcolor' '0xffba00' -'vb.anaglyph.rcolor' '0x00baff' -'vb.xscale' 2 -'vb.yscale' 2 %ROM%",
            },
            {
                name: "Anaglyph Red/Green",
                path: "%MEDNAFEN%",
                args: "-'vb.3dmode' 'anaglyph' -'vb.anaglyph.preset' 'red_green' -'vb.anaglyph.lcolor' '0xffba00' -'vb.anaglyph.rcolor' '0x00baff' -'vb.xscale' 2 -'vb.yscale' 2 %ROM%",
            },
            {
                name: "Anaglyph Green/Magenta",
                path: "%MEDNAFEN%",
                args: "-'vb.3dmode' 'anaglyph' -'vb.anaglyph.preset' 'green_magenta' -'vb.anaglyph.lcolor' '0xffba00' -'vb.anaglyph.rcolor' '0x00baff' -'vb.xscale' 2 -'vb.yscale' 2 %ROM%",
            },
            {
                name: "Anaglyph Yellow/Blue",
                path: "%MEDNAFEN%",
                args: "-'vb.3dmode' 'anaglyph' -'vb.anaglyph.preset' 'yellow_blue' -'vb.anaglyph.lcolor' '0xffba00' -'vb.anaglyph.rcolor' '0x00baff' -'vb.xscale' 2 -'vb.yscale' 2 %ROM%",
            },
            {
                name: "CyberScope",
                path: "%MEDNAFEN%",
                args: "-'vb.3dmode' 'cscope' -'vb.xscale' 1 -'vb.yscale' 1 %ROM%",
            },
            {
                name: "Side-by-Side",
                path: "%MEDNAFEN%",
                args: "-'vb.3dmode' 'sidebyside' -'vb.xscale' 1 -'vb.yscale' 1 %ROM%",
            },
            {
                name: "Vertical Line Interlaced",
                path: "%MEDNAFEN%",
                args: "-'vb.3dmode' 'vli' -'vb.xscale' 1 -'vb.yscale' 1 %ROM%",
            },
            {
                name: "Horizontal Line Interlaced",
                path: "%MEDNAFEN%",
                args: "-'vb.3dmode' 'hli' -'vb.xscale' 1 -'vb.yscale' 1 %ROM%",
            },
        ],
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