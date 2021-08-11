import { homedir } from 'os';
import { join as joinPath } from 'path';
import { PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';

export namespace VesProjectsPreferenceIds {
    export const CATEGORY = 'projects';

    export const BASE_FOLDER = [CATEGORY, 'baseFolder'].join('.');
    export const MAKER_CODE = [CATEGORY, 'makerCode'].join('.');
}

export const VesProjectsPreferenceSchema: PreferenceSchema = {
    'type': 'object',
    'properties': {
        [VesProjectsPreferenceIds.BASE_FOLDER]: {
            type: 'string',
            description: 'Base folder for new projects.',
            default: joinPath(homedir(), 'vuengine', 'projects'),
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
