import { PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';
import { homedir } from 'os';
import { join } from 'path';

export namespace VesPluginsPreferenceIds {
    export const CATEGORY = 'plugins';

    export const ENGINE_PLUGINS_PATH = [CATEGORY, 'library', 'path'].join('.');
    export const ENGINE_PLUGINS_INCLUDE_IN_WORKSPACE = [CATEGORY, 'library', 'includeInWorkspace'].join('.');
    export const USER_PLUGINS_PATH = [CATEGORY, 'user', 'path'].join('.');
    export const USER_PLUGINS_INCLUDE_IN_WORKSPACE = [CATEGORY, 'user', 'includeInWorkspace'].join('.');
}

export const VesPluginsPreferenceSchema: PreferenceSchema = {
    'type': 'object',
    'properties': {
        [VesPluginsPreferenceIds.ENGINE_PLUGINS_PATH]: {
            type: 'string',
            description: 'Full path to plugins library. Uses built-in VUEngine Plugins library when left blank.',
            default: '',
            additionalProperties: {
                isDirectory: true
            },
        },
        [VesPluginsPreferenceIds.ENGINE_PLUGINS_INCLUDE_IN_WORKSPACE]: {
            type: 'boolean',
            description: 'Automatically include plugins library in workspaces.',
            default: false,
        },
        [VesPluginsPreferenceIds.USER_PLUGINS_PATH]: {
            type: 'string',
            description: 'Full path to base folder for all user plugins.',
            // TODO: use EnvVariablesServer.getHomeDirUri()
            default: join(homedir(), 'vuengine', 'plugins'),
            additionalProperties: {
                isDirectory: true,
            },
        },
        [VesPluginsPreferenceIds.USER_PLUGINS_INCLUDE_IN_WORKSPACE]: {
            type: 'boolean',
            description: 'Automatically include user plugins in workspaces.',
            default: false,
        },
    },
};
