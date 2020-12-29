import { VesProperty } from "../common/types";
import { BuildMode, DEFAULT_BUILD_MODE } from "./types";

export const VesBuildModePreference: VesProperty = {
    id: "build.buildMode",
    property: {
        type: "string",
        default: DEFAULT_BUILD_MODE,
        enum: [
            BuildMode.release,
            BuildMode.beta,
            BuildMode.tools,
            BuildMode.debug,
            BuildMode.preprocessor,
        ],
    },
};

export const VesBuildDumpElfPreference: VesProperty = {
    id: "build.dumpElf",
    property: {
        type: "boolean",
        description: "Dump assembly code and memory sections",
        default: false,
    },
};

export const VesBuildPedanticWarningsPreference: VesProperty = {
    id: "build.pedanticWarnings",
    property: {
        type: "boolean",
        description: "Enable pedantic compiler warnigns",
        default: false,
    },
};

export const VesBuildEnableWslPreference: VesProperty = {
    id: "build.enableWsl",
    property: {
        type: "boolean",
        description: "Build in WSL for faster compilation times",
        default: false,
    },
};