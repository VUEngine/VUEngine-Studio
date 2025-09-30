import { nls, PreferenceScope } from '@theia/core';
import { PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';

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
            description: nls.localize(
                'vuengine/plugins/preferences/libraryPathDescription',
                'Full path to plugins library. Must be a folder named "plugins" inside a parent folder named "vuengine". \
Must not live inside the VUEngine Core or user plugins directories. Must not contain repeated occurences of any of the terms "core", \
"plugins", "user" or "vuengine". Uses built-in VUEngine Plugins library when left blank.'
            ),
            default: '',
            additionalProperties: {
                // @ts-ignore
                isDirectory: true,
            },
            scope: PreferenceScope.Folder,
            overridable: true,
        },
        [VesPluginsPreferenceIds.ENGINE_PLUGINS_INCLUDE_IN_WORKSPACE]: {
            type: 'boolean',
            description: nls.localize('vuengine/plugins/preferences/includeLibraryInWorkspaceDescription', 'Automatically include plugins library in workspaces.'),
            default: true,
            scope: PreferenceScope.Folder,
            overridable: true,
        },
        [VesPluginsPreferenceIds.USER_PLUGINS_PATH]: {
            type: 'string',
            description: nls.localize(
                'vuengine/plugins/preferences/userLibraryPathDescription',
                'Full path to base folder that contains user plugins. Must be a folder named "user" inside a parent folder named "vuengine". \
Must not live inside the VUEngine Plugins or Core directories. Must not contain repeated occurences of any of the terms "core", \
"plugins", "user" or "vuengine". Defaults to [HOME]/vuengine/plugins if left blank.'
            ),
            additionalProperties: {
                // @ts-ignore
                isDirectory: true,
            },
            scope: PreferenceScope.Folder,
            overridable: true,
        },
        [VesPluginsPreferenceIds.USER_PLUGINS_INCLUDE_IN_WORKSPACE]: {
            type: 'boolean',
            description: nls.localize('vuengine/plugins/preferences/includeUserLibraryInWorkspaceDescription', 'Automatically include user plugins in workspaces.'),
            default: false,
            scope: PreferenceScope.Folder,
            overridable: true,
        },
    },
};
