import { PreferenceSchema } from '@theia/core/lib/common/preferences/preference-schema';
import { BuildMode, DEFAULT_BUILD_MODE } from './ves-build-types';

export namespace VesBuildPreferenceIds {
    export const CATEGORY = 'build';

    export const BUILD_MODE = [CATEGORY, 'mode'].join('.');
    export const DUMP_ELF = [CATEGORY, 'dumpElf'].join('.');
    export const PEDANTIC_WARNINGS = [CATEGORY, 'pedanticWarnings'].join('.');
    export const ENABLE_WSL = [CATEGORY, 'enableWsl'].join('.');
    export const ENGINE_CORE_PATH = [CATEGORY, 'engine', 'coreLibraryPath'].join('.');
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
        },
        [VesBuildPreferenceIds.DUMP_ELF]: {
            type: 'boolean',
            description: 'Dump assembly code and memory sections.',
            default: false,
        },
        [VesBuildPreferenceIds.PEDANTIC_WARNINGS]: {
            type: 'boolean',
            description: 'Enable pedantic compiler warnings.',
            default: false,
        },
        [VesBuildPreferenceIds.ENABLE_WSL]: {
            type: 'boolean',
            description: 'Build in WSL for faster compilation times.',
            default: false,
        },
        [VesBuildPreferenceIds.ENGINE_CORE_PATH]: {
            type: 'string',
            description: 'Full path to the core library. Uses built-in vuengine-core when left blank.',
            default: '',
            additionalProperties: {
                isDirectory: true,
            },
        },
    },
};
