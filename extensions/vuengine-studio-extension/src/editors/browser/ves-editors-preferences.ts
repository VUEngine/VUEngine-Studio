import { PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';

export namespace VesEditorsPreferenceIds {
  export const CATEGORY = 'editors';
  export const CATEGORY_ACTOR = 'actor';
  export const CATEGORY_SOUND = 'sound';

  // export const EDITORS_SOUND_AUTO_START = [CATEGORY, CATEGORY_SOUND, 'autoStart'].join('.');
}

export const VesEditorsPreferenceSchema: PreferenceSchema = {
  properties: {
    // TODO
    /*
    [VesEditorsPreferenceIds.EDITORS_SOUND_AUTO_START]: {
      type: 'boolean',
      label: 'Auto Start',
      description: nls.localize(
        'vuengine/editors/sound/preferences/autoStartPlayback',
        'Automatically start playback.'
      ),
      default: false,
      scope: PreferenceScope.Folder,
      overridable: true,
    },
    */
  },
};
