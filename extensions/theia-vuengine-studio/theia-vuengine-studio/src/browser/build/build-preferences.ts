import { VesProperty } from "../common/common-types";
import { BuildMode, DEFAULT_BUILD_MODE } from "./build-types";

export namespace VesBuildPrefs {
    export const BUILD_MODE: VesProperty = {
        id: "build.buildMode",
        property: {
            type: "string",
            default: DEFAULT_BUILD_MODE,
            enum: [
                BuildMode.Release,
                BuildMode.Beta,
                BuildMode.Tools,
                BuildMode.Debug,
                BuildMode.Preprocessor,
            ],
        },
    };

    export const DUMP_ELF: VesProperty = {
        id: "build.dumpElf",
        property: {
            type: "boolean",
            description: "Dump assembly code and memory sections.",
            default: false,
        },
    };

    export const PEDANTIC_WARNINGS: VesProperty = {
        id: "build.pedanticWarnings",
        property: {
            type: "boolean",
            description: "Enable pedantic compiler warnings.",
            default: false,
        },
    };

    export const ENABLE_WSL: VesProperty = {
        id: "build.enableWsl",
        property: {
            type: "boolean",
            description: "Build in WSL for faster compilation times.",
            default: false,
        },
    };

    export const ENGINE_CORE_PATH: VesProperty = {
        id: "engine.coreLibraryPath",
        property: {
            type: "string",
            description: "Full path to the core library. Uses built-in vuengine-core when left blank.",
            default: "",
        },
    };

    export const ENGINE_PLUGINS_PATH: VesProperty = {
        id: "engine.pluginsLibraryPath",
        property: {
            type: "string",
            description: "Full path to the plugins library. Uses built-in vuengine-plugins when left blank.",
            default: "",
        },
    };
};
