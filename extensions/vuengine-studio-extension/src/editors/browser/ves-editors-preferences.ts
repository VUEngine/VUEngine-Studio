import { nls } from '@theia/core';
import { PreferenceScope } from '@theia/core/lib/browser';
import { PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';

export namespace VesEditorsPreferenceIds {
  export const CATEGORY = 'editors';
  export const CATEGORY_VSU_SANDBOX = 'vsuSandbox';

  export const EDITORS_VSU_SANDBOX_AUTO_START = [CATEGORY, CATEGORY_VSU_SANDBOX, 'autoStart'].join('.');
}

export const VesEditorsPreferenceSchema: PreferenceSchema = {
  type: 'object',
  properties: {
    [VesEditorsPreferenceIds.EDITORS_VSU_SANDBOX_AUTO_START]: {
      type: 'boolean',
      label: 'Auto Start',
      description: nls.localize(
        'vuengine/editors/preferences/vsuSandboxAutoStart',
        'Automatically start VSU emulation.'
      ),
      default: false,
      scope: PreferenceScope.Folder,
      overridable: true,
    },
  },
};
