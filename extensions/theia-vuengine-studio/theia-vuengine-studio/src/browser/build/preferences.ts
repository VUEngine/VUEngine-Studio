import { VesProperty } from "../common/types";
import { BuildMode, DEFAULT_BUILD_MODE } from "./types";

export const VesBuildModePreference: VesProperty = {
    id: "build.build.buildMode",
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

export const VesBuildDumpElfPreference: VesProperty = {
    id: "build.build.dumpElf",
    property: {
        type: "boolean",
        description: "Dump assembly code and memory sections",
        default: false,
    },
};

export const VesBuildMakerCodePreference: VesProperty = {
    id: "build.build.makerCode",
    property: {
        type: "string",
        minLength: 2,
        maxLength: 2,
        description: "Default Maker Code to place in ROM header of new projects",
        default: "VS",
    },
};

export const VesBuildPedanticWarningsPreference: VesProperty = {
    id: "build.build.pedanticWarnings",
    property: {
        type: "boolean",
        description: "Enable pedantic compiler warnigns",
        default: false,
    },
};

export const VesBuildEnableWslPreference: VesProperty = {
    id: "build.build.enableWsl",
    property: {
        type: "boolean",
        description: "Build in WSL for faster compilation times",
        default: false,
    },
};

export const VesBuildEngineCorePathPreference: VesProperty = {
    id: "build.engine.coreLibraryPath",
    property: {
        type: "string",
        description: "Full path to the core library. Uses built-in vuengine-core when left blank.",
        default: "",
    },
};

export const VesBuildEnginePluginsPathPreference: VesProperty = {
    id: "build.engine.pluginsLibraryPath",
    property: {
        type: "string",
        description: "Full path to the plugins library. Uses built-in vuengine-plugins when left blank.",
        default: "",
    },
};
