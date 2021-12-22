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
            description: 'Base folder for new projects.'
        },
        [VesProjectsPreferenceIds.AUTHOR]: {
            type: 'string',
            description: 'Default author name to use for new projects.',
            default: 'VUEngine Studio',
        },
        [VesProjectsPreferenceIds.MAKER_CODE]: {
            type: 'string',
            minLength: 2,
            maxLength: 2,
            description: 'Default Maker Code to place in ROM header of new projects.',
            default: 'VS',
        },
    },
};
