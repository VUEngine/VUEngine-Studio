import { homedir } from 'os';
import { join as joinPath } from 'path';
import { PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';

export namespace VesPluginsPreferenceIds {
    export const CATEGORY = 'plugins';

    export const CUSTOM_PLUGINS_PATH = [CATEGORY, 'customPath'].join('.');
    export const ENGINE_PLUGINS_PATH = [CATEGORY, 'libraryPath'].join('.');
}

export const VesPluginsPreferenceSchema: PreferenceSchema = {
    'type': 'object',
    'properties': {
        [VesPluginsPreferenceIds.ENGINE_PLUGINS_PATH]: {
            type: 'string',
            description: 'Full path to the plugins library. Uses built-in VUEngine Plugins library when left blank.',
            default: '',
        },
        [VesPluginsPreferenceIds.CUSTOM_PLUGINS_PATH]: {
            type: 'string',
            description: 'Base folder for all custom plugins.',
            default: joinPath(homedir(), 'vuengine', 'plugins'),
        },
    },
};
