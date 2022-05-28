import { nls } from '@theia/core';
import { PreferenceScope } from '@theia/core/lib/browser';
import { PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';

export namespace VesGettingStartedPreferenceIds {
    export const CATEGORY = 'gettingStarted';

    export const ALWAYS_SHOW_WELCOME_PAGE = [CATEGORY, 'alwaysShow'].join('.');
}

export const VesGettingStartedPreferenceSchema: PreferenceSchema = {
    'type': 'object',
    'properties': {
        [VesGettingStartedPreferenceIds.ALWAYS_SHOW_WELCOME_PAGE]: {
            type: 'boolean',
            description: nls.localize('vuengine/gettingStarted/preferences/showGettingStartedDescription',
                'Show Getting Started page when no project is opened.'),
            default: true,
            scope: PreferenceScope.User,
            overridable: true,
        },
    },
};
