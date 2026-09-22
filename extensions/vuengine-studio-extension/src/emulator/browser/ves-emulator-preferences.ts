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
  export const EMULATOR_BUILTIN_SRAM_WINDOW = [CATEGORY, 'builtIn', 'sram', 'window'].join('.');
  export const EMULATOR_BUILTIN_COMPANION_FILES = [CATEGORY, 'builtIn', 'saveData', 'location'].join('.');
  export const EMULATOR_BUILTIN_SAVE_GAME_SLOT = [CATEGORY, 'builtIn', 'saveData', 'slot'].join('.');
  // Save states the emulator writes by itself: on a timer while a game runs,
  // and one per ROM when a game is put away.
  export const EMULATOR_BUILTIN_AUTO_SAVE_STATES_ENABLE = [CATEGORY, 'builtIn', 'saveStates', 'auto', 'enable'].join('.');
  export const EMULATOR_BUILTIN_AUTO_SAVE_STATE_INTERVAL = [CATEGORY, 'builtIn', 'saveStates', 'auto', 'interval'].join('.');
  export const EMULATOR_BUILTIN_AUTO_SAVE_STATE_COUNT = [CATEGORY, 'builtIn', 'saveStates', 'auto', 'count'].join('.');
  export const EMULATOR_BUILTIN_SUSPEND_RESUME_ENABLE = [CATEGORY, 'builtIn', 'saveStates', 'suspendResume', 'enable'].join('.');
  export const EMULATOR_BUILTIN_SUSPEND_RESUME_START = [CATEGORY, 'builtIn', 'saveStates', 'suspendResume', 'start'].join('.');
  export const EMULATOR_BUILTIN_HARDWARE_MODE = [CATEGORY, 'builtIn', 'hardwareMode'].join('.');
  export const EMULATOR_BUILTIN_DECORATION = [CATEGORY, 'builtIn', 'decoration', 'type'].join('.');
  export const EMULATOR_BUILTIN_DECORATION_COLOR = [CATEGORY, 'builtIn', 'decoration', 'color'].join('.');
  export const EMULATOR_BUILTIN_DECORATION_COLOR_FROM_PALETTE = [CATEGORY, 'builtIn', 'decoration', 'colorFromPalette'].join('.');
  export const EMULATOR_BUILTIN_DECORATION_INTENSITY = [CATEGORY, 'builtIn', 'decoration', 'intensity'].join('.');
  export const EMULATOR_BUILTIN_SCREENSHOT_USE_DISPLAY_SETTINGS = [CATEGORY, 'builtIn', 'screenshot', 'useDisplaySettings'].join('.');
  export const EMULATOR_BUILTIN_SCREENSHOT_RENDERING_MODE = [CATEGORY, 'builtIn', 'screenshot', 'renderingMode'].join('.');
  export const EMULATOR_BUILTIN_SCREENSHOT_SCALE = [CATEGORY, 'builtIn', 'screenshot', 'scale'].join('.');
  export const EMULATOR_BUILTIN_SCREENSHOT_PALETTE = [CATEGORY, 'builtIn', 'screenshot', 'palette'].join('.');
  export const EMULATOR_BUILTIN_SCREENSHOT_ANAGLYPH_PALETTE = [CATEGORY, 'builtIn', 'screenshot', 'anaglyphPalette'].join('.');
  export const EMULATOR_BUILTIN_VIDEO_USE_DISPLAY_SETTINGS = [CATEGORY, 'builtIn', 'video', 'useDisplaySettings'].join('.');
  export const EMULATOR_BUILTIN_VIDEO_RENDERING_MODE = [CATEGORY, 'builtIn', 'video', 'renderingMode'].join('.');
  export const EMULATOR_BUILTIN_VIDEO_SCALE = [CATEGORY, 'builtIn', 'video', 'scale'].join('.');
  export const EMULATOR_BUILTIN_VIDEO_PALETTE = [CATEGORY, 'builtIn', 'video', 'palette'].join('.');
  export const EMULATOR_BUILTIN_VIDEO_ANAGLYPH_PALETTE = [CATEGORY, 'builtIn', 'video', 'anaglyphPalette'].join('.');
  export const EMULATOR_BUILTIN_VIDEO_QUALITY = [CATEGORY, 'builtIn', 'video', 'quality'].join('.');
  export const EMULATOR_BUILTIN_VIDEO_FORMAT = [CATEGORY, 'builtIn', 'video', 'format'].join('.');
  export const EMULATOR_BUILTIN_GAMEPAD_PROFILES = [CATEGORY, 'builtIn', 'gamepad', 'profiles'].join('.');
  export const EMULATOR_BUILTIN_GAMEPAD_PLAYERS = [CATEGORY, 'builtIn', 'gamepad', 'players'].join('.');
  export const EMULATOR_BUILTIN_GAMEPAD_RUMBLE_ENABLE = [CATEGORY, 'builtIn', 'gamepad', 'rumble', 'enable'].join('.');
  export const EMULATOR_BUILTIN_RETROACHIEVEMENTS_ENABLE = [CATEGORY, 'builtIn', 'retroAchievements', 'enable'].join('.');
  export const EMULATOR_BUILTIN_RETROACHIEVEMENTS_HARDCORE = [CATEGORY, 'builtIn', 'retroAchievements', 'hardcore'].join('.');
  export const EMULATOR_BUILTIN_DEBUG_PANEL_STATE = [CATEGORY, 'builtIn', 'debug', 'panelState'].join('.');
  export const EMULATOR_BUILTIN_ERROR_SOUND_ENABLE = [CATEGORY, 'builtIn', 'sound', 'error'].join('.');
  export const EMULATOR_BUILTIN_ACHIEVEMENT_SOUND_ENABLE = [CATEGORY, 'builtIn', 'sound', 'achievement'].join('.');
  export const EMULATOR_BUILTIN_VB_COLOR_ENABLE = [CATEGORY, 'builtIn', 'vbColor', 'enable'].join('.');
  export const EMULATOR_BUILTIN_VB_COLOR_AUTO_APPLY_PATCHES = [CATEGORY, 'builtIn', 'vbColor', 'autoApplyPatches'].join('.');
  export const EMULATOR_BUILTIN_VB_COLOR_DISABLED_PATCHES = [CATEGORY, 'builtIn', 'vbColor', 'disabledPatches'].join('.');
  export const EMULATOR_BUILTIN_VB_COLOR_PALETTE_OVERRIDES = [CATEGORY, 'builtIn', 'vbColor', 'paletteOverrides'].join('.');
  export const EMULATOR_BUILTIN_VB_COLOR_PALETTE_NAMES = [CATEGORY, 'builtIn', 'vbColor', 'paletteNames'].join('.');
}

export const VUEPORT_PREFERENCE_IDS: Record<keyof VueportConfig, string> = {
    renderingMode: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_RENDERING_MODE,
    palette: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_PALETTE,
    anaglyphPalette: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_ANAGLYPH_PALETTE,
    customPalettes: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_PALETTES,
    customAnaglyphPalettes: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_ANAGLYPH_PALETTES,
    scale: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SCALE,
    sramInit: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SRAM_INIT,
    sramWindow: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SRAM_WINDOW,
    companionFiles: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_COMPANION_FILES,
    saveGameSlot: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SAVE_GAME_SLOT,
    autoSaveStatesEnabled: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_AUTO_SAVE_STATES_ENABLE,
    autoSaveStateInterval: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_AUTO_SAVE_STATE_INTERVAL,
    autoSaveStateCount: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_AUTO_SAVE_STATE_COUNT,
    suspendResumeEnabled: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SUSPEND_RESUME_ENABLE,
    suspendResumeStart: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SUSPEND_RESUME_START,
    hardwareMode: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_HARDWARE_MODE,
    decoration: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_DECORATION,
    decorationColor: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_DECORATION_COLOR,
    decorationColorFromPalette: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_DECORATION_COLOR_FROM_PALETTE,
    decorationIntensity: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_DECORATION_INTENSITY,
    screenshotUseDisplaySettings: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SCREENSHOT_USE_DISPLAY_SETTINGS,
    screenshotRenderingMode: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SCREENSHOT_RENDERING_MODE,
    screenshotScale: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SCREENSHOT_SCALE,
    screenshotPalette: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SCREENSHOT_PALETTE,
    screenshotAnaglyphPalette: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SCREENSHOT_ANAGLYPH_PALETTE,
    videoUseDisplaySettings: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_VIDEO_USE_DISPLAY_SETTINGS,
    videoRenderingMode: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_VIDEO_RENDERING_MODE,
    videoScale: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_VIDEO_SCALE,
    videoPalette: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_VIDEO_PALETTE,
    videoAnaglyphPalette: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_VIDEO_ANAGLYPH_PALETTE,
    videoQuality: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_VIDEO_QUALITY,
    videoFormat: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_VIDEO_FORMAT,
    gamepadProfiles: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_GAMEPAD_PROFILES,
    gamepadPlayers: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_GAMEPAD_PLAYERS,
    gamepadRumbleEnabled: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_GAMEPAD_RUMBLE_ENABLE,
    retroAchievementsEnabled: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_RETROACHIEVEMENTS_ENABLE,
    retroAchievementsHardcore: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_RETROACHIEVEMENTS_HARDCORE,
    debugPanelState: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_DEBUG_PANEL_STATE,
    errorSoundEnabled: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_ERROR_SOUND_ENABLE,
    achievementSoundEnabled: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_ACHIEVEMENT_SOUND_ENABLE,
    vbcSupportEnabled: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_VB_COLOR_ENABLE,
    vbcAutoApplyColorPatches: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_VB_COLOR_AUTO_APPLY_PATCHES,
    vbcColorPatchesDisabled: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_VB_COLOR_DISABLED_PATCHES,
    vbcColorPaletteOverrides: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_VB_COLOR_PALETTE_OVERRIDES,
    vbcColorPaletteNames: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_VB_COLOR_PALETTE_NAMES,
    player2SameControls: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_PLAYER_2_SAME_CONTROLS,
    rewindEnabled: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_REWIND_ENABLE,
    rewindGranularity: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_REWIND_GRANULARITY,
    rewindBufferSize: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_REWIND_BUFFER_SIZE,
    slowMotionRatio: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SLOW_MOTION_RATIO,
    fastForwardRatio: VesEmulatorPreferenceIds.EMULATOR_BUILTIN_FAST_FORWARD_RATIO,
};

const UNUSED_HERE: readonly (keyof VueportConfig)[] = [
  'videoUseDisplaySettings', 'videoRenderingMode', 'videoScale', 'videoPalette',
  'videoAnaglyphPalette', 'videoQuality', 'videoFormat',
];

function builtInProperties(): PreferenceSchema['properties'] {
  const properties: PreferenceSchema['properties'] = {};
  const schema = vueportSettingsSchema();
  for (const key of Object.keys(VUEPORT_DEFAULTS) as (keyof VueportConfig)[]) {
    const described = schema[key];
    properties[VUEPORT_PREFERENCE_IDS[key]] = {
      ...(described ?? { type: jsonTypeOf(VUEPORT_DEFAULTS[key]) }),
      hidden: described === undefined || UNUSED_HERE.includes(key),
      default: VUEPORT_DEFAULTS[key],
      scope: PreferenceScope.Folder,
      overridable: true,
    } as PreferenceDataProperty;
  }
  return properties;
}

function jsonTypeOf(value: unknown): string {
  if (Array.isArray(value)) {
    return 'array';
  }
  return value === null ? 'object' : typeof value;
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
