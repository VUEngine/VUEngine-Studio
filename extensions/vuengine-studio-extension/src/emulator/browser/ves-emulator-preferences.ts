import { nls } from '@theia/core';
import { PreferenceScope } from '@theia/core/lib/browser';
import { PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';
import {
  EMULATION_MODES,
  EMULATION_SCALES,
  EMULATION_STEREO_MODES,
} from './ves-emulator-types';

export namespace VesEmulatorPreferenceIds {
  export const CATEGORY = 'emulator';

  export const EMULATORS = [CATEGORY, 'custom', 'configs'].join('.');
  export const DEFAULT_EMULATOR = [CATEGORY, 'custom', 'default'].join('.');
  export const EMULATOR_AUTO_QUEUE = [CATEGORY, 'autoQueue'].join('.');
  export const EMULATOR_BUILTIN_STEREO_MODE = [CATEGORY, 'builtIn', 'stereoMode'].join('.');
  export const EMULATOR_BUILTIN_EMULATION_MODE = [CATEGORY, 'builtIn', 'emulationMode'].join('.');
  export const EMULATOR_BUILTIN_SCALE = [CATEGORY, 'builtIn', 'scale'].join('.');
  export const EMULATOR_BUILTIN_REWIND_ENABLE = [CATEGORY, 'builtIn', 'rewind', 'enable'].join('.');
  export const EMULATOR_BUILTIN_REWIND_GRANULARITY = [CATEGORY, 'builtIn', 'rewind', 'granularity'].join('.');
  export const EMULATOR_BUILTIN_SLOW_MOTION_RATIO = [CATEGORY, 'builtIn', 'slowMotion', 'ratio'].join('.');
  export const EMULATOR_BUILTIN_FAST_FORWARD_RATIO = [CATEGORY, 'builtIn', 'fastForward', 'ratio'].join('.');
  export const EMULATOR_RED_VIPER_3DS_IP_ADDRESS = [CATEGORY, 'redViper', '3dsIpAddress'].join('.');
}

export const VesEmulatorPreferenceSchema: PreferenceSchema = {
  type: 'object',
  properties: {
    [VesEmulatorPreferenceIds.EMULATORS]: {
      type: 'array',
      label: 'Custom Emulator Configurations',
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
      label: 'Default Emulator',
      description: nls.localize(
        'vuengine/emulator/preferences/customDefaultDescription',
        'Emulator configuration that shall be used to run compiled ROMs. Uses built-in emulator if left blank.'
      ),
      default: '',
      scope: PreferenceScope.Folder,
      overridable: true,
    },
    [VesEmulatorPreferenceIds.EMULATOR_BUILTIN_STEREO_MODE]: {
      type: 'string',
      label: 'Stereo Mode',
      description: nls.localize(
        'vuengine/emulator/preferences/builtInStereoModeDescription',
        'Stereoscopy display mode of built-in emulator.'
      ),
      enum: Object.keys(EMULATION_STEREO_MODES),
      enumItemLabels: Object.values(EMULATION_STEREO_MODES),
      default: Object.keys(EMULATION_STEREO_MODES)[0],
      scope: PreferenceScope.Folder,
      overridable: true,
    },
    [VesEmulatorPreferenceIds.EMULATOR_BUILTIN_EMULATION_MODE]: {
      type: 'string',
      label: 'Emulation Mode',
      description: nls.localize(
        'vuengine/emulator/preferences/builtInEmulationModeDescription',
        'Emulation mode of built-in emulator.'
      ),
      enum: Object.keys(EMULATION_MODES),
      enumItemLabels: Object.values(EMULATION_MODES),
      default: Object.keys(EMULATION_MODES)[0],
      scope: PreferenceScope.Folder,
      overridable: true,
    },
    [VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SCALE]: {
      type: 'string',
      label: 'Scale',
      description: nls.localize(
        'vuengine/emulator/preferences/builtInScalingModeDescription',
        'Scaling mode of built-in emulator.'
      ),
      enum: Object.keys(EMULATION_SCALES),
      enumItemLabels: Object.values(EMULATION_SCALES),
      default: Object.keys(EMULATION_SCALES)[0],
      scope: PreferenceScope.Folder,
      overridable: true,
    },
    [VesEmulatorPreferenceIds.EMULATOR_AUTO_QUEUE]: {
      type: 'boolean',
      label: 'Auto Queue',
      description: nls.localize(
        'vuengine/emulator/preferences/automaticallyQueueWhenBuildStarted',
        'Automatically queue when a build is started.'
      ),
      default: false,
      scope: PreferenceScope.Folder,
      overridable: true,
    },
    [VesEmulatorPreferenceIds.EMULATOR_BUILTIN_REWIND_ENABLE]: {
      type: 'boolean',
      label: 'Enable Rewind',
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
      label: 'Rewind Granularity',
      description: nls.localize(
        'vuengine/emulator/preferences/builtInRewindGranularityDescription',
        'Defines how many frames per step the rewind function should go back at a time.'
      ),
      default: 1,
      minimum: 0,
      maximum: 32,
      scope: PreferenceScope.Folder,
      overridable: true,
    },
    [VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SLOW_MOTION_RATIO]: {
      type: 'number',
      label: 'Slow Motion Ratio',
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
      label: 'Fast Forward Ratio',
      description: nls.localize(
        'vuengine/emulator/preferences/builtInFastForwardRatioDescription',
        'The maximum rate at which content will be run when using fast forward. (E.g. 5.0 means 50 Hz * 5.0 = 250 fps cap). 0 means no FPS cap.'
      ),
      default: 0.0,
      minimum: 0,
      maximum: 32,
      // TODO: allow 0.1 steps
      scope: PreferenceScope.Folder,
      overridable: true,
    },
    [VesEmulatorPreferenceIds.EMULATOR_RED_VIPER_3DS_IP_ADDRESS]: {
      type: 'string',
      label: '3DS IP Address',
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
