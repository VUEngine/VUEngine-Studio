import { PreferenceScope } from '@theia/core/lib/browser';
import { PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';

export namespace VesProjectsPreferenceIds {
    export const CATEGORY = 'projects';

    export const BASE_PATH = [CATEGORY, 'basePath'].join('.');
    export const AUTHOR = [CATEGORY, 'author'].join('.');
    export const MAKER_CODE = [CATEGORY, 'makerCode'].join('.');
}

export const VesProjectsPreferenceSchema: PreferenceSchema = {
    'type': 'object',
    'properties': {
        [VesProjectsPreferenceIds.BASE_PATH]: {
            type: 'string',
            description: 'Base path for new projects.',
            additionalProperties: {
                isDirectory: true,
            },
            scope: PreferenceScope.User,
            overridable: true,
        },
        [VesProjectsPreferenceIds.AUTHOR]: {
            type: 'string',
            description: 'Default author name to use for new projects.',
            default: 'VUEngine Studio User',
            scope: PreferenceScope.User,
            overridable: true,
        },
        [VesProjectsPreferenceIds.MAKER_CODE]: {
            type: 'string',
            minLength: 2,
            maxLength: 2,
            description: 'Default Maker Code to place in ROM header of new projects.',
            default: 'VU',
            scope: PreferenceScope.User,
            overridable: true,
        },
    },
};
