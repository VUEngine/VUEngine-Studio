import { VesProperty } from "../common/types";

export const VesFlashCartsCustomPreference: VesProperty = {
    id: "build.flash.customFlashCarts",
    property: {
        type: "array",
        label: "Flash Cart Configurations",
        description: "Additional configurations for custom flash carts",
        items: {
            type: "object",
            title: "Flash cart config",
            properties: {
                name: {
                    type: "string",
                    description: "Name of the flash cart configuration",
                    minimum: 1
                },
                vid: {
                    type: "number",
                    description: "USB vendor ID (VID) of the flash cart",
                    minimum: 0,
                    maximum: 65535,
                },
                pid: {
                    type: "number",
                    description: "USB product ID (PID) of the flash cart",
                    minimum: 0,
                    maximum: 65535,
                },
                manufacturer: {
                    type: "string",
                    description: "USB manufacturer string of the flash cart (optional)",
                },
                product: {
                    type: "string",
                    description: "USB product string of the flash cart (optional)",
                },
                size: {
                    type: "number",
                    description: "Size of flash cart (in Mbit)",
                    minimum: 1,
                    maximum: 256,
                },
                path: {
                    type: "string",
                    description: "Full path to flasher software",
                },
                args: {
                    type: "string",
                    multiline: true,
                    description: "Arguments to pass to flasher software",
                },
                padRom: {
                    type: "boolean",
                    description:
                        "Should ROMs be padded before being passed to the flasher program?",
                },
            },
        },
        default: [],
    },
}