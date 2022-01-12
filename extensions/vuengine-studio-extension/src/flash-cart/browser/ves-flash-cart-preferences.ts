import { isOSX } from '@theia/core';
import { PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';
import {
    FLASHBOY_PLUS_IMAGE_PLACEHOLDER,
    FLASHBOY_PLUS_PREFERENCE_NAME,
    HBCLI_PLACEHOLDER,
    HFCLI_PLACEHOLDER,
    HYPERBOY_IMAGE_PLACEHOLDER,
    HYPERBOY_PREFERENCE_NAME,
    HYPERFLASH32_IMAGE_PLACEHOLDER,
    HYPERFLASH32_PREFERENCE_NAME,
    NAME_NO_SPACES_PLACEHOLDER,
    PROG_VB_PLACEHOLDER, ROM_PLACEHOLDER
} from './ves-flash-cart-types';

export namespace VesFlashCartPreferenceIds {
    export const CATEGORY = 'flashCarts';

    export const FLASH_CARTS = [CATEGORY, 'configs'].join('.');
}

export const VesFlashCartPreferenceSchema: PreferenceSchema = {
    'type': 'object',
    'properties': {
        [VesFlashCartPreferenceIds.FLASH_CARTS]: {
            type: 'array',
            label: 'Flash Cart Configurations',
            description: 'Configurations for flash cart auto-detection and flashing.',
            items: {
                type: 'object',
                title: 'Flash cart config',
                properties: {
                    name: {
                        type: 'string',
                        description: 'Name of the flash cart configuration',
                        minimum: 1
                    },
                    vid: {
                        type: 'number',
                        description: 'USB vendor ID (VID) of the flash cart',
                        minimum: 0,
                        maximum: 65535,
                    },
                    pid: {
                        type: 'number',
                        description: 'USB product ID (PID) of the flash cart',
                        minimum: 0,
                        maximum: 65535,
                    },
                    manufacturer: {
                        type: 'string',
                        description: 'USB manufacturer string of the flash cart (optional)',
                    },
                    product: {
                        type: 'string',
                        description: 'USB product string of the flash cart (optional)',
                    },
                    size: {
                        type: 'number',
                        description: 'Size of flash cart (in Mbit)',
                        minimum: 1,
                        maximum: 256,
                    },
                    path: {
                        type: 'string',
                        description: 'Full path to flasher software',
                    },
                    args: {
                        type: 'string',
                        multiline: true,
                        description: 'Arguments to pass to flasher software. You can use the following placeholders: '
                            + '%NAME%: project\'s name '
                            + '%NAME_NO_SPACE%: project\'s name with spaces removed '
                            + '%ROM%: project\'s output ROM image path '
                            + '%PORT%: port the flash cart is connected to ',
                    },
                    padRom: {
                        type: 'boolean',
                        description: 'Should ROMs be padded before being passed to the flasher program?',
                    },
                    image: {
                        type: 'string',
                        description: 'Representative image URL of the flash cart.',
                    },
                },
            },
            default: [
                {
                    name: FLASHBOY_PLUS_PREFERENCE_NAME,
                    vid: 6017,
                    pid: 2466,
                    manufacturer: 'Richard Hutchinson',
                    product: 'FlashBoy',
                    size: 16,
                    path: PROG_VB_PLACEHOLDER,
                    args: ROM_PLACEHOLDER,
                    padRom: true,
                    image: FLASHBOY_PLUS_IMAGE_PLACEHOLDER,
                },
                {
                    name: HYPERFLASH32_PREFERENCE_NAME,
                    vid: 1027,
                    pid: 24577,
                    manufacturer: 'FTDI',
                    product: 'FT232R',
                    size: 32,
                    path: HFCLI_PLACEHOLDER,
                    args: isOSX
                        ? `-p %PORT% -x ${ROM_PLACEHOLDER} -n ${NAME_NO_SPACES_PLACEHOLDER} --slow`
                        : `-p %PORT% -x ${ROM_PLACEHOLDER} -n ${NAME_NO_SPACES_PLACEHOLDER}`,
                    padRom: false,
                    image: HYPERFLASH32_IMAGE_PLACEHOLDER,
                },
                {
                    name: HYPERBOY_PREFERENCE_NAME,
                    vid: 1027,
                    pid: 24577,
                    manufacturer: 'RETROONYX',
                    product: 'HYPERBOY',
                    size: 32,
                    path: HBCLI_PLACEHOLDER,
                    args: isOSX
                        ? `-p %PORT% -f ${ROM_PLACEHOLDER} --slow`
                        : `-p %PORT% -f ${ROM_PLACEHOLDER}`,
                    padRom: false,
                    image: HYPERBOY_IMAGE_PLACEHOLDER,
                },
            ],
        },
    },
};
