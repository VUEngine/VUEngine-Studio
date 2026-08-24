import { nls, PreferenceScope } from '@theia/core';
import { PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';
import {
  VB_DEFAULT_ANAGLYPH_PALETTE_ID,
  VB_DEFAULT_PALETTE_ID,
  VB_DEFAULT_RENDERING_MODE,
  VB_LEVELS,
} from '../common/ves-vb-constants';
import {
  EMULATION_RENDERING_MODES,
  EMULATOR_SRAM_INIT_LABELS,
  EmulatorScale,
  EmulatorSramInit,
} from './ves-emulator-types';

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

export const VesEmulatorPreferenceSchema: PreferenceSchema = {
  properties: {
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
    [VesEmulatorPreferenceIds.EMULATOR_BUILTIN_RENDERING_MODE]: {
      type: 'string',
      title: nls.localize(
        'vuengine/emulator/preferences/builtInRenderingModeTitle',
        'Rendering Mode',
      ),
      description: nls.localize(
        'vuengine/emulator/preferences/builtInRenderingModeDescription',
        'How the built-in emulator presents the two eyes. The colors each mode is shown in are configured separately.'
      ),
      enum: Object.keys(EMULATION_RENDERING_MODES),
      enumItemLabels: Object.values(EMULATION_RENDERING_MODES),
      default: VB_DEFAULT_RENDERING_MODE,
      scope: PreferenceScope.Folder,
      overridable: true,
    },
    [VesEmulatorPreferenceIds.EMULATOR_BUILTIN_PALETTE]: {
      type: 'string',
      title: nls.localize(
        'vuengine/emulator/preferences/builtInPaletteTitle',
        'Color Palette',
      ),
      description: nls.localize(
        'vuengine/emulator/preferences/builtInPaletteDescription',
        'Colors the built-in emulator shows the four display brightness levels in, in every rendering mode but Anaglyph. '
        + 'Can be one of the built-in palettes or, as "custom:<name>", one defined in Custom Color Palettes.'
      ),
      default: VB_DEFAULT_PALETTE_ID,
      scope: PreferenceScope.Folder,
      overridable: true,
    },
    [VesEmulatorPreferenceIds.EMULATOR_BUILTIN_ANAGLYPH_PALETTE]: {
      type: 'string',
      title: nls.localize(
        'vuengine/emulator/preferences/builtInAnaglyphPaletteTitle',
        'Anaglyph Colors',
      ),
      description: nls.localize(
        'vuengine/emulator/preferences/builtInAnaglyphPaletteDescription',
        'Tints the built-in emulator assigns to the eyes in the Anaglyph rendering mode. Pick the pair your glasses filter. '
        + 'Can be one of the built-in pairs or, as "custom:<name>", one defined in Custom Anaglyph Colors.'
      ),
      default: VB_DEFAULT_ANAGLYPH_PALETTE_ID,
      scope: PreferenceScope.Folder,
      overridable: true,
    },
    [VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_PALETTES]: {
      type: 'array',
      title: nls.localize(
        'vuengine/emulator/preferences/builtInCustomPalettesTitle',
        'Custom Color Palettes'
      ),
      description: nls.localize(
        'vuengine/emulator/preferences/builtInCustomPalettesDescription',
        'User-defined palettes, offered alongside the built-in ones.'
      ),
      items: {
        type: 'object',
        title: 'Custom color palette',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the palette.',
            title: 'Name',
          },
          colors: {
            type: 'array',
            description: "The display's four brightness levels, from unlit to fully lit, as #rrggbb.",
            title: 'Colors',
            items: {
              type: 'string',
            },
            minItems: VB_LEVELS,
            maxItems: VB_LEVELS,
          },
        },
      },
      default: [],
      scope: PreferenceScope.Folder,
      overridable: true,
    },
    [VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_ANAGLYPH_PALETTES]: {
      type: 'array',
      title: nls.localize(
        'vuengine/emulator/preferences/builtInCustomAnaglyphPalettesTitle',
        'Custom Anaglyph Colors'
      ),
      description: nls.localize(
        'vuengine/emulator/preferences/builtInCustomAnaglyphPalettesDescription',
        'User-defined anaglyph tint pairs, offered alongside the built-in ones.'
      ),
      items: {
        type: 'object',
        title: 'Custom anaglyph colors',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the color pair.',
            title: 'Name',
          },
          left: {
            type: 'string',
            description: 'Tint of the left eye, as #rrggbb.',
            title: 'Left',
          },
          right: {
            type: 'string',
            description: 'Tint of the right eye, as #rrggbb.',
            title: 'Right',
          },
        },
      },
      default: [],
      scope: PreferenceScope.Folder,
      overridable: true,
    },
    [VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SCALE]: {
      type: 'string',
      title: nls.localize(
        'vuengine/emulator/preferences/builtInScalingModeTitle',
        'Scale'
      ),
      description: nls.localize(
        'vuengine/emulator/preferences/builtInScalingModeDescription',
        'Scaling mode of built-in emulator.'
      ),
      enum: Object.keys(EmulatorScale),
      enumItemLabels: Object.values(EmulatorScale),
      default: EmulatorScale.AUTO,
      scope: PreferenceScope.Folder,
      overridable: true,
    },
    [VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SRAM_INIT]: {
      type: 'string',
      title: nls.localize(
        'vuengine/emulator/preferences/sramInitTitle',
        'New Save File Contents'
      ),
      description: nls.localize(
        'vuengine/emulator/preferences/sramInitDescription',
        'What a save file is filled with before a game has written to it. A real cartridge powers up \
holding whatever its memory settled on, which is why random is the default and what hardware \
does. All zeroes is not a blank slate but one particular pattern, which a game may read as a \
valid save. Choose zeroes when debugging save handling and a reproducible starting point \
matters more than realism. Only affects newly created save files.'
      ),
      enum: Object.keys(EMULATOR_SRAM_INIT_LABELS),
      enumItemLabels: Object.values(EMULATOR_SRAM_INIT_LABELS),
      default: EmulatorSramInit.RANDOM,
      scope: PreferenceScope.Folder,
      overridable: true,
    },
    [VesEmulatorPreferenceIds.EMULATOR_BUILTIN_PLAYER_2_SAME_CONTROLS]: {
      type: 'boolean',
      title: nls.localize(
        'vuengine/emulator/preferences/player2SameControlsTitle',
        'Player 2 Uses Player 1 Controls'
      ),
      description: nls.localize(
        'vuengine/emulator/preferences/player2SameControlsDescription',
        "Whether the second emulator of a link session answers to the same keys as the first. \
Turn this off to map a separate set of keys for player 2, \
in the emulator's Configure Input window."
      ),
      default: true,
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
    [VesEmulatorPreferenceIds.EMULATOR_BUILTIN_REWIND_ENABLE]: {
      type: 'boolean',
      title: nls.localize(
        'vuengine/emulator/preferences/builtInEnableRewindTitle',
        'Enable Rewind'
      ),
      description: nls.localize(
        'vuengine/emulator/preferences/builtInEnableRewindDescription',
        'Enable rewinding. Will cause a performance hit when playing.'
      ),
      default: false,
      scope: PreferenceScope.Folder,
      overridable: true,
    },
    [VesEmulatorPreferenceIds.EMULATOR_BUILTIN_REWIND_GRANULARITY]: {
      type: 'number',
      title: nls.localize(
        'vuengine/emulator/preferences/builtInRewindGranularityTitle',
        'Rewind Granularity'
      ),
      description: nls.localize(
        'vuengine/emulator/preferences/builtInRewindGranularityDescription',
        'Defines how many frames per step the rewind function should go back at a time. '
        + 'Higher values cover more time with the same amount of memory, at a coarser resolution.'
      ),
      default: 1,
      minimum: 1,
      maximum: 32,
      scope: PreferenceScope.Folder,
      overridable: true,
    },
    [VesEmulatorPreferenceIds.EMULATOR_BUILTIN_REWIND_BUFFER_SIZE]: {
      type: 'number',
      title: nls.localize(
        'vuengine/emulator/preferences/builtInRewindBufferSizeTitle',
        'Rewind Buffer Size'
      ),
      description: nls.localize(
        'vuengine/emulator/preferences/builtInRewindBufferSizeDescription',
        'Maximum memory in MB the rewind history may use. Only what changes between steps is '
        + 'stored, which measures at around 16 KB per step, so the default holds roughly 80 '
        + 'seconds at a granularity of 1 and proportionally longer above that.'
      ),
      default: 64,
      minimum: 8,
      maximum: 1024,
      scope: PreferenceScope.Folder,
      overridable: true,
    },
    [VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SLOW_MOTION_RATIO]: {
      type: 'number',
      title: nls.localize(
        'vuengine/emulator/preferences/builtInSlowMotionRatioTitle',
        'Slow Motion Ratio'
      ),
      description: nls.localize(
        'vuengine/emulator/preferences/builtInSlowMotionRatioDescription',
        'When using slowmotion, content will slow down by this factor. High values might render the emulator unresponsive. Keep key pressed to exit slow motion.'
      ),
      default: 3.0,
      minimum: 1.0,
      maximum: 32.0,
      // TODO: allow 0.1 steps
      scope: PreferenceScope.Folder,
      overridable: true,
    },
    [VesEmulatorPreferenceIds.EMULATOR_BUILTIN_FAST_FORWARD_RATIO]: {
      type: 'number',
      title: nls.localize(
        'vuengine/emulator/preferences/builtInFastForwardRatioTitle',
        'Fast Forward Ratio'
      ),
      description: nls.localize(
        'vuengine/emulator/preferences/builtInFastForwardRatioDescription',
        'The rate at which content will be run when using fast forward. (E.g. 5.0 means 50 Hz * 5.0 = 250 fps).'
      ),
      default: 4.0,
      minimum: 1,
      maximum: 32,
      // TODO: allow 0.1 steps
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
