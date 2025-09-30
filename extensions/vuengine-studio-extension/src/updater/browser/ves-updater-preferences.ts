import { nls, PreferenceScope } from '@theia/core';
import { PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';

export namespace VesUpdaterPreferenceIds {
    export const CATEGORY = 'updater';

    export const REPORT_ON_START = [CATEGORY, 'reportOnStart'].join('.');
}

export const VesUpdaterPreferenceSchema: PreferenceSchema = {
    'properties': {
        [VesUpdaterPreferenceIds.REPORT_ON_START]: {
            type: 'boolean',
            description: nls.localize('vuengine/updater/preferences/reportOnStartDescription', 'Report available updates after application start.'),
            default: true,
            scope: PreferenceScope.User,
            overridable: true,
        }
    }
};
