import { isOSX } from "@theia/core";
import { VesProperty } from "../common/common-types";

export namespace VesFlashCartsPrefs {
    export const FLASH_CARTS: VesProperty = {
        id: "flashCarts.configurations",
        property: {
            type: "array",
            label: "Flash Cart Configurations",
            description: "Configurations for flash cart auto-detection and flashing.",
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
                        description: "Arguments to pass to flasher software. You can use the following placeholders: "
                            + "%ROM%: project's output ROM image path "
                            + "%PORT%: port the flash cart is connected to ",
                    },
                    padRom: {
                        type: "boolean",
                        description: "Should ROMs be padded before being passed to the flasher program?",
                    },
                    image: {
                        type: "string",
                        description: "Representative image URL of the flash cart.",
                    },
                },
            },
            default: [
                {
                    name: "FlashBoy (Plus)",
                    vid: 6017,
                    pid: 2466,
                    manufacturer: "Richard Hutchinson",
                    product: "FlashBoy",
                    size: 16,
                    path: "%PROGVB%",
                    args: "%ROM%",
                    padRom: true,
                    image: "%FBP_IMG%"
                },
                {
                    name: "HyperFlash32",
                    vid: 1027,
                    pid: 24577,
                    manufacturer: "FTDI",
                    product: "FT232R",
                    size: 32,
                    path: "%HFCLI%",
                    args: isOSX
                        ? `-p %PORT% -s %ROM% -u --slow`
                        : `-p %PORT% -s %ROM% -u`,
                    padRom: false,
                    image: "%HF32_IMG%"
                },
            ],
        },
    };
}