import { nls } from '@theia/core';
import { PreferenceScope } from '@theia/core/lib/browser';
import { PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';

export namespace VesProjectPreferenceIds {
    export const CATEGORY = 'projects';

    export const BASE_PATH = [CATEGORY, 'basePath'].join('.');
    export const AUTHOR = [CATEGORY, 'author'].join('.');
    export const MAKER_CODE = [CATEGORY, 'makerCode'].join('.');
}

export const VesProjectPreferenceSchema: PreferenceSchema = {
    'type': 'object',
    'properties': {
        [VesProjectPreferenceIds.BASE_PATH]: {
            type: 'string',
            description: nls.localize('vuengine/projects/preferences/basePathDescription', 'Base path for new projects.'),
            additionalProperties: {
                // @ts-ignore
                isDirectory: true,
            },
            scope: PreferenceScope.User,
            overridable: true,
        },
        [VesProjectPreferenceIds.AUTHOR]: {
            type: 'string',
            description: nls.localize('vuengine/projects/preferences/authorDescription', 'Default author name to use for new projects.'),
            default: nls.localize('vuengine/projects/preferences/authorDefault', 'VUEngine Studio User'),
            scope: PreferenceScope.User,
            overridable: true,
        },
        [VesProjectPreferenceIds.MAKER_CODE]: {
            type: 'string',
            minLength: 2,
            maxLength: 2,
            description: nls.localize('vuengine/projects/preferences/makerCodeDescription', 'Default Maker Code to place in ROM header of new projects.'),
            default: 'VU',
            scope: PreferenceScope.User,
            overridable: true,
        },
    },
};
