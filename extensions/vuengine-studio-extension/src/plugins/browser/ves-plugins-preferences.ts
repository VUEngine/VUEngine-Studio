import { nls } from '@theia/core';
import { PreferenceScope } from '@theia/core/lib/browser';
import { PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';

export namespace VesPluginsPreferenceIds {
    export const CATEGORY = 'plugins';

    export const USER_PLUGINS_PATH = [CATEGORY, 'user', 'path'].join('.');
    export const USER_PLUGINS_INCLUDE_IN_WORKSPACE = [CATEGORY, 'user', 'includeInWorkspace'].join('.');
}

export const VesPluginsPreferenceSchema: PreferenceSchema = {
    'type': 'object',
    'properties': {
        [VesPluginsPreferenceIds.USER_PLUGINS_PATH]: {
            type: 'string',
            description: nls.localize('vuengine/plugins/preferences/userLibraryPathDescription', 'Full path to base folder that contains user plugins. Must not be within the VUEngine Plugins directory. Defaults to [HOME]/vuengine/plugins if left blank.'),
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
