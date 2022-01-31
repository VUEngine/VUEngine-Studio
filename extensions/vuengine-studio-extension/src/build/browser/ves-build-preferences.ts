import { PreferenceScope } from '@theia/core/lib/browser';
import { PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';
import { BuildMode, DEFAULT_BUILD_MODE, PrePostBuildTaskType } from './ves-build-types';

export namespace VesBuildPreferenceIds {
    export const CATEGORY = 'build';

    export const BUILD_MODE = [CATEGORY, 'mode'].join('.');
    export const DUMP_ELF = [CATEGORY, 'dumpElf'].join('.');
    export const PEDANTIC_WARNINGS = [CATEGORY, 'pedanticWarnings'].join('.');
    export const ENGINE_CORE_PATH = [CATEGORY, 'engine', 'core', 'path'].join('.');
    export const ENGINE_CORE_INCLUDE_IN_WORKSPACE = [CATEGORY, 'engine', 'core', 'includeInWorkspace'].join('.');
    export const PRE_BUILD_TASKS = [CATEGORY, 'tasks', 'pre'].join('.');
    export const POST_BUILD_TASKS = [CATEGORY, 'tasks', 'post'].join('.');
}

export const VesBuildPreferenceSchema: PreferenceSchema = {
    'type': 'object',
    'properties': {
        [VesBuildPreferenceIds.BUILD_MODE]: {
            type: 'string',
            default: DEFAULT_BUILD_MODE,
            enum: [
                BuildMode.Release,
                BuildMode.Beta,
                BuildMode.Tools,
                BuildMode.Debug,
                BuildMode.Preprocessor,
            ],
            scope: PreferenceScope.Folder,
            overridable: true,
        },
        [VesBuildPreferenceIds.DUMP_ELF]: {
            type: 'boolean',
            description: 'Dump assembly code and memory sections.',
            default: false,
            scope: PreferenceScope.Folder,
            overridable: true,
        },
        [VesBuildPreferenceIds.PEDANTIC_WARNINGS]: {
            type: 'boolean',
            description: 'Enable pedantic compiler warnings.',
            default: false,
            scope: PreferenceScope.Folder,
            overridable: true,
        },
        [VesBuildPreferenceIds.ENGINE_CORE_PATH]: {
            type: 'string',
            description: 'Full path to core library. Uses built-in VUEngine Core when left blank.',
            default: '',
            additionalProperties: {
                isDirectory: true,
            },
            scope: PreferenceScope.Folder,
            overridable: true,
        },
        [VesBuildPreferenceIds.ENGINE_CORE_INCLUDE_IN_WORKSPACE]: {
            type: 'boolean',
            description: 'Automatically include core library in workspaces.',
            default: false,
            scope: PreferenceScope.Folder,
            overridable: true,
        },
        [VesBuildPreferenceIds.PRE_BUILD_TASKS]: {
            type: 'array',
            label: 'Pre-Build Tasks',
            description: 'List of Tasks and Commands to execute before building.',
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
            label: 'Post-Build Tasks',
            description: 'List of Tasks and Commands to execute after building.',
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
    },
};
