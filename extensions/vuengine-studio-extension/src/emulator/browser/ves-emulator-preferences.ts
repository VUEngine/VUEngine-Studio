import { nls, PreferenceScope } from '@theia/core';
import { PreferenceDataProperty, PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';
import { VUEPORT_DEFAULTS, VueportConfig } from 'vueport-core/lib/common/emulator-settings';
import { vueportSettingsSchema } from 'vueport-core/lib/browser/emulator-settings-schema';

export namespace VesEmulatorPreferenceIds {
  export const CATEGORY = 'emulator';

  export const EMULATORS = [CATEGORY, 'custom', 'configs'].join('.');
  export const DEFAULT_EMULATOR = [CATEGORY, 'custom', 'default'].join('.');
  export const EMULATOR_AUTO_QUEUE = [CATEGORY, 'autoQueue'].join('.');
  export const EMULATOR_BUILTIN_RENDERING_MODE = [CATEGORY, 'builtIn', 'renderingMode'].join('.');
  export const EMULATOR_BUILTIN_PALETTE = [CATEGORY, 'builtIn', 'palette'].join('.');
  export const EMULATOR_BUILTIN_ANAGLYPH_PALETTE = [CATEGORY, 'builtIn', 'anaglyphPalette'].join('.');
  export const EMULATOR_BUILTIN_CUSTOM_PALETTES = [CATEGORY, 'builtIn', 'customPalettes'].join('.');
  export const EMULATOR_BUILTIN_CUSTOM_ANAGLYPH_PALETTES = [CATEGORY, 'builtIn', 'customAnaglyphPalettes'].join('.');
  export const EMULATOR_BUILTIN_SCALE = [CATEGORY, 'builtIn', 'scale'].join('.');
  export const EMULATOR_BUILTIN_REWIND_ENABLE = [CATEGORY, 'builtIn', 'rewind', 'enable'].join('.');
  export const EMULATOR_BUILTIN_REWIND_GRANULARITY = [CATEGORY, 'builtIn', 'rewind', 'granularity'].join('.');
  export const EMULATOR_BUILTIN_REWIND_BUFFER_SIZE = [CATEGORY, 'builtIn', 'rewind', 'bufferSize'].join('.');
  export const EMULATOR_BUILTIN_SLOW_MOTION_RATIO = [CATEGORY, 'builtIn', 'slowMotion', 'ratio'].join('.');
  export const EMULATOR_BUILTIN_FAST_FORWARD_RATIO = [CATEGORY, 'builtIn', 'fastForward', 'ratio'].join('.');
  export const EMULATOR_RED_VIPER_3DS_IP_ADDRESS = [CATEGORY, 'redViper', '3dsIpAddress'].join('.');
  export const EMULATOR_BUILTIN_PLAYER_2_SAME_CONTROLS = [CATEGORY, 'builtIn', 'player2', 'sameControls'].join('.');
  export const EMULATOR_BUILTIN_SRAM_INIT = [CATEGORY, 'builtIn', 'sram', 'init'].join('.');
}

/**
 * Which Theia preference each of the emulator's settings is kept in.
 *
 * The one place the two namespaces meet. Everything else on the emulator's side
 * says `palette`; everything on Theia's says `emulator.builtIn.palette`.
 */
export const VUEPORT_PREFERENCE_IDS: Record<keyof VueportConfig, string> = {
    renderingMode: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_RENDERING_MODE,
    palette: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_PALETTE,
    anaglyphPalette: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_ANAGLYPH_PALETTE,
    customPalettes: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_PALETTES,
    customAnaglyphPalettes: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_ANAGLYPH_PALETTES,
    scale: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SCALE,
    sramInit: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SRAM_INIT,
    player2SameControls: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_PLAYER_2_SAME_CONTROLS,
    rewindEnabled: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_REWIND_ENABLE,
    rewindGranularity: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_REWIND_GRANULARITY,
    rewindBufferSize: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_REWIND_BUFFER_SIZE,
    slowMotionRatio: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SLOW_MOTION_RATIO,
    fastForwardRatio: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_FAST_FORWARD_RATIO,
};

/**
 * The emulator's own settings, as Theia preferences.
 *
 * Generated from `vueportSettingsSchema()` rather than written out again: what
 * a setting is — its type, title, description, bounds — belongs to the
 * emulator, and only the things Theia needs on top of that are added here.
 */
function builtInProperties(): PreferenceSchema['properties'] {
  const properties: PreferenceSchema['properties'] = {};
  const schema = vueportSettingsSchema();
  for (const key of Object.keys(schema) as (keyof VueportConfig)[]) {
    properties[VUEPORT_PREFERENCE_IDS[key]] = {
      ...schema[key],
      default: VUEPORT_DEFAULTS[key],
      // Per folder, because which palette or scale suits a project is a
      // property of the project as much as of the person.
      scope: PreferenceScope.Folder,
      overridable: true,
    } as PreferenceDataProperty;
  }
  return properties;
}

export const VesEmulatorPreferenceSchema: PreferenceSchema = {
  properties: {
    ...builtInProperties(),
    [VesEmulatorPreferenceIds.EMULATORS]: {
      type: 'array',
      title: nls.localize(
        'vuengine/emulator/preferences/customConfigsTitle',
        'Custom Emulator Configurations'
      ),
      description: nls.localize(
        'vuengine/emulator/preferences/customConfigsDescription',
        'User-defined emulator configurations for running compiled ROMs.'
      ),
      items: {
        type: 'object',
        title: 'Emulator configs',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the emulator configuration.',
            title: 'Name',
          },
          path: {
            type: 'string',
            description: 'Full path to emulator.',
            title: 'Path',
          },
          args: {
            type: 'string',
            description:
              "Arguments to pass to emulator. You can use the placeholder %ROM% for the project's output ROM image path.",
            title: 'Arguments',
          },
        },
      },
      default: [],
      scope: PreferenceScope.Folder,
      overridable: true,
    },
    [VesEmulatorPreferenceIds.DEFAULT_EMULATOR]: {
      type: 'string',
      title: nls.localize(
        'vuengine/emulator/preferences/customDefaultTitle',
        'Default Emulator'
      ),
      description: nls.localize(
        'vuengine/emulator/preferences/customDefaultDescription',
        'Emulator configuration that shall be used to run compiled ROMs. Uses built-in emulator if left blank.'
      ),
      default: '',
      scope: PreferenceScope.Folder,
      overridable: true,
    },
    [VesEmulatorPreferenceIds.EMULATOR_AUTO_QUEUE]: {
      type: 'boolean',
      title: nls.localize(
        'vuengine/emulator/preferences/autoQueueTitle',
        'Auto Queue'
      ),
      description: nls.localize(
        'vuengine/emulator/preferences/autoQueueDescription',
        'Automatically queue when a build is started.'
      ),
      default: false,
      scope: PreferenceScope.Folder,
      overridable: true,
    },
    [VesEmulatorPreferenceIds.EMULATOR_RED_VIPER_3DS_IP_ADDRESS]: {
      type: 'string',
      title: nls.localize(
        'vuengine/emulator/preferences/redViper3dsIpAddressTitle',
        '3DS IP Address'
      ),
      description: nls.localize(
        'vuengine/emulator/preferences/redViper3dsIpAddressDescription',
        'The IP address of the Nintendo 3DS running Red Viper.'
      ),
      default: '192.168.0.100',
      scope: PreferenceScope.Folder,
      overridable: true,
    },
  },
};
