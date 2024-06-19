import { isWindows, nls } from '@theia/core';
import { PreferenceScope } from '@theia/core/lib/browser';
import { PreferenceSchema, PreferenceSchemaProperties } from '@theia/core/lib/common/preferences/preference-schema';
import { BuildMode, DEFAULT_BUILD_MODE, PrePostBuildTaskType } from './ves-build-types';

export namespace VesBuildPreferenceIds {
    export const CATEGORY = 'build';

    export const AUTO_CLOSE_WIDGET_ON_BUILD_START = [CATEGORY, 'autoCloseWidgetOnBuildStart'].join('.');
    export const AUTO_CLOSE_WIDGET_ON_SUCCESS = [CATEGORY, 'autoCloseWidgetOnSuccess'].join('.');
    export const AUTO_FILTER_LOGS_ON_ERROR = [CATEGORY, 'autoFilterLogsOnError'].join('.');
    export const AUTO_FILTER_LOGS_ON_WARNING = [CATEGORY, 'autoFilterLogsOnWarning'].join('.');
    export const AUTO_OPEN_WIDGET_ON_ERROR = [CATEGORY, 'autoOpenWidgetOnError'].join('.');
    export const BUILD_MODE = [CATEGORY, 'mode'].join('.');
    export const DUMP_ELF = [CATEGORY, 'dumpElf'].join('.');
    export const PEDANTIC_WARNINGS = [CATEGORY, 'pedanticWarnings'].join('.');
    export const ENGINE_CORE_PATH = [CATEGORY, 'engine', 'core', 'path'].join('.');
    export const ENGINE_CORE_INCLUDE_IN_WORKSPACE = [CATEGORY, 'engine', 'core', 'includeInWorkspace'].join('.');
    export const PRE_BUILD_TASKS = [CATEGORY, 'tasks', 'pre'].join('.');
    export const POST_BUILD_TASKS = [CATEGORY, 'tasks', 'post'].join('.');
    export const LOG_LINE_WRAP = [CATEGORY, 'logLineWrap'].join('.');
    export const USE_WSL = [CATEGORY, 'useWsl'].join('.');
}

const properties: PreferenceSchemaProperties = {
    [VesBuildPreferenceIds.BUILD_MODE]: {
        type: 'string',
        default: DEFAULT_BUILD_MODE,
        enum: [
            BuildMode.Release,
            BuildMode.Beta,
            BuildMode.Tools,
            BuildMode.Debug,
        ],
        scope: PreferenceScope.Folder,
        overridable: true,
    },
    [VesBuildPreferenceIds.DUMP_ELF]: {
        type: 'boolean',
        description: nls.localize('vuengine/build/preferences/dumpElfDescription', 'Dump assembly code and memory sections.'),
        default: false,
        scope: PreferenceScope.Folder,
        overridable: true,
    },
    [VesBuildPreferenceIds.PEDANTIC_WARNINGS]: {
        type: 'boolean',
        description: nls.localize('vuengine/build/preferences/pedanticWarningsDescription', 'Enable pedantic compiler warnings.'),
        default: false,
        scope: PreferenceScope.Folder,
        overridable: true,
    },
    [VesBuildPreferenceIds.ENGINE_CORE_PATH]: {
        type: 'string',
        // eslint-disable-next-line max-len
        description: nls.localize('vuengine/build/preferences/engineCorePathDescription', 'Full path to core library. Must be a folder named "core" inside a parent folder named "vuengine". Must not live inside the VUEngine Plugins or user plugins directories. Must not contain repeated occurences of any of the terms "core", "plugins", "user" or "vuengine". Uses built-in VUEngine Core when left blank.'),
        default: '',
        additionalProperties: {
            // @ts-ignore
            isDirectory: true,
        },
        scope: PreferenceScope.Folder,
        overridable: true,
    },
    [VesBuildPreferenceIds.ENGINE_CORE_INCLUDE_IN_WORKSPACE]: {
        type: 'boolean',
        description: nls.localize('vuengine/build/preferences/includeEngineCoreInWorkspaceDescription', 'Automatically include VUEngine libraries in workspaces.'),
        default: true,
        scope: PreferenceScope.Folder,
        overridable: true,
    },
    [VesBuildPreferenceIds.PRE_BUILD_TASKS]: {
        type: 'array',
        label: nls.localize('vuengine/build/preferences/preBuildTasks', 'Pre-Build Tasks'),
        description: nls.localize('vuengine/build/preferences/preBuildTasksDescription', 'List of Tasks and Commands to execute before building.'),
        items: {
            type: 'object',
            title: 'Tasks & Commands',
            properties: {
                type: {
                    type: 'string',
                    description: 'Type - Task or Command',
                    enum: [
                        PrePostBuildTaskType.Task,
                        PrePostBuildTaskType.Command,
                    ],
                    label: 'Type',
                },
                name: {
                    type: 'string',
                    description: 'Name/ID of Task or Command',
                    label: 'Name/ID',
                },
            },
        },
        default: [],
        scope: PreferenceScope.Folder,
        overridable: true,
    },
    [VesBuildPreferenceIds.POST_BUILD_TASKS]: {
        type: 'array',
        label: nls.localize('vuengine/build/preferences/postBuildTasks', 'Post-Build Tasks'),
        description: nls.localize('vuengine/build/preferences/postBuildTasksDescription', 'List of Tasks and Commands to execute after building.'),
        items: {
            type: 'object',
            title: 'Tasks & Commands',
            properties: {
                type: {
                    type: 'string',
                    description: 'Type - Task or Command',
                    enum: [
                        PrePostBuildTaskType.Task,
                        PrePostBuildTaskType.Command,
                    ],
                    label: 'Type',
                },
                name: {
                    type: 'string',
                    description: 'Name/ID of Task or Command',
                    label: 'Name/ID',
                },
            },
        },
        default: [],
        scope: PreferenceScope.Folder,
        overridable: true,
    },
    [VesBuildPreferenceIds.LOG_LINE_WRAP]: {
        type: 'boolean',
        description: nls.localize('vuengine/build/preferences/logLineWrap', 'Wrap lines in build log.'),
        default: true,
        scope: PreferenceScope.Folder,
        overridable: true,
    },
    [VesBuildPreferenceIds.AUTO_CLOSE_WIDGET_ON_BUILD_START]: {
        type: 'boolean',
        description: nls.localize('vuengine/build/preferences/autoCloseWidgetWhenBuildStarts', 'Automatically close widget when the build starts.'),
        default: false,
        scope: PreferenceScope.Folder,
        overridable: true,
    },
    [VesBuildPreferenceIds.AUTO_CLOSE_WIDGET_ON_SUCCESS]: {
        type: 'boolean',
        description: nls.localize('vuengine/build/preferences/autoCloseWidgetOnSuccess', 'Automatically close widget when the build succeded.'),
        default: true,
        scope: PreferenceScope.Folder,
        overridable: true,
    },
    [VesBuildPreferenceIds.AUTO_FILTER_LOGS_ON_ERROR]: {
        type: 'boolean',
        description: nls.localize('vuengine/build/preferences/autoFilterLogsByError', 'Automatically filter build logs to show only errors when the build failed.'),
        default: false,
        scope: PreferenceScope.Folder,
        overridable: true,
    },
    [VesBuildPreferenceIds.AUTO_FILTER_LOGS_ON_WARNING]: {
        type: 'boolean',
        description: nls.localize(
            'vuengine/build/preferences/autoFilterLogsByWarning',
            'Automatically filter build logs to show only warning when the build succeeded with warnings.'
        ),
        default: false,
        scope: PreferenceScope.Folder,
        overridable: true,
    },
    [VesBuildPreferenceIds.AUTO_OPEN_WIDGET_ON_ERROR]: {
        type: 'boolean',
        description: nls.localize('vuengine/build/preferences/autoOpenWidgetOnError', 'Automatically open widget when the build failed.'),
        default: true,
        scope: PreferenceScope.Folder,
        overridable: true,
    },
};

if (isWindows) {
    properties[VesBuildPreferenceIds.USE_WSL] = {
        type: 'boolean',
        description: nls.localize('vuengine/build/preferences/useWsl', 'Automatically build through WSL if detected.'),
        default: true,
        scope: PreferenceScope.Folder,
        overridable: true,
    };
}

export const VesBuildPreferenceSchema: PreferenceSchema = {
    'type': 'object',
    'properties': properties,
};
