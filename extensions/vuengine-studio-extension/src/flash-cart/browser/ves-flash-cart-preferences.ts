import { nls, PreferenceScope } from '@theia/core';
import { PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';

export namespace VesFlashCartPreferenceIds {
  export const CATEGORY = 'flashCarts';

  export const FLASH_CARTS = [CATEGORY, 'configs'].join('.');
  export const FLASH_CARTS_AUTO_QUEUE = [CATEGORY, 'autoQueue'].join('.');
}

export const VesFlashCartPreferenceSchema: PreferenceSchema = {
  properties: {
    [VesFlashCartPreferenceIds.FLASH_CARTS]: {
      type: 'array',
      title: nls.localize(
        'vuengine/flashCarts/preferences/flashCartsTitle',
        'Custom Flash Cart Configurations'
      ),
      description: nls.localize(
        'vuengine/flashCarts/preferences/flashCartsDescription',
        'Configurations for flash cart auto-detection and flashing.'
      ),
      items: {
        type: 'object',
        title: 'Flash cart config',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the flash cart configuration',
            minimum: 1,
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
            description:
              "Arguments to pass to flasher software. You can use the following placeholders: \
%NAME%: project's name \
%NAME_NO_SPACE%: project's name with spaces removed \
%ROM%: project's output ROM image path \
%PORT%: port the flash cart is connected to ",
          },
          padRom: {
            type: 'boolean',
            description:
              'Should ROMs be padded before being passed to the flasher program?',
          },
          image: {
            type: 'string',
            description: 'Representative image URL of the flash cart.',
          },
        },
      },
      default: [],
      scope: PreferenceScope.Folder,
      overridable: true,
    },
    [VesFlashCartPreferenceIds.FLASH_CARTS_AUTO_QUEUE]: {
      type: 'boolean',
      title: nls.localize(
        'vuengine/flashCarts/preferences/flashCartsAutoQueueTitle',
        'Auto Queue'
      ),
      description: nls.localize(
        'vuengine/flashCarts/preferences/flashCartsAutoQueueDescription',
        'Automatically queue when a build is started.'
      ),
      default: false,
      scope: PreferenceScope.Folder,
      overridable: true,
    },
  },
};
