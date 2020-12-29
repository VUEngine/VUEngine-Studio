import { Command } from "@theia/core";

export const VesBuildCommand: Command = {
    id: "VesBuild.commands.build",
    label: "Build Project",
    category: "Build",
    iconClass: "fa fa-wrench",
};

export const VesBuildCleanCommand: Command = {
    id: "VesBuild.commands.clean",
    label: "Clean Build Folder",
    category: "Build",
    iconClass: "fa fa-trash",
};

export const VesBuildExportCommand: Command = {
    id: "VesBuild.commands.export",
    label: "Export ROM...",
    category: "Build",
    iconClass: "fa fa-share-square-o",
};

export const VesBuildSetModeCommand: Command = {
    id: "VesBuild.commands.setMode",
    label: `Set Build Mode`,
    category: "Build",
};
export const VesBuildSetModeReleaseCommand: Command = {
    id: "VesBuild.commands.setMode.release",
    label: `Set Build Mode to "release"`,
    category: "Build"
};
export const VesBuildSetModeBetaCommand: Command = {
    id: "VesBuild.commands.setMode.beta",
    label: `Set Build Mode to "beta"`,
    category: "Build",
};
export const VesBuildSetModeToolsCommand: Command = {
    id: "VesBuild.commands.setMode.tools",
    label: `Set Build Mode to "tools"`,
    category: "Build",
};
export const VesBuildSetModeDebugCommand: Command = {
    id: "VesBuild.commands.setMode.debug",
    label: `Set Build Mode to "debug"`,
    category: "Build",
};
export const VesBuildSetModePreprocessorCommand: Command = {
    id: "VesBuild.commands.setMode.preprocessor",
    label: `Set Build Mode to "preprocessor"`,
    category: "Build",
};

export const VesBuildToggleDumpElfCommand: Command = {
    id: "VesBuild.commands.dumpElf.toggle",
    label: "Toggle Dump ELF",
    category: "Build",
};
export const VesBuildTogglePedanticWarningsCommand: Command = {
    id: "VesBuild.commands.pedanticWarnings.toggle",
    label: "Toggle Pedantic Warnings",
    category: "Build",
};
export const VesBuildToggleEnableWslCommand: Command = {
    id: "VesBuild.commands.enableWsl.toggle",
    label: "Toggle use WSL for building",
    category: "Build",
};