import { PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';

export namespace VesBrandingPreferenceIds {
    export const CATEGORY = 'gettingStartedPage';

    export const ALWAYS_SHOW_WELCOME_PAGE = [CATEGORY, 'alwaysShow'].join('.');
}

export const VesBrandingPreferenceSchema: PreferenceSchema = {
    'type': 'object',
    'properties': {
        [VesBrandingPreferenceIds.ALWAYS_SHOW_WELCOME_PAGE]: {
            type: 'boolean',
            description: 'Show Getting Started page when no workspace is loaded.',
            default: true,
        },
    },
};
