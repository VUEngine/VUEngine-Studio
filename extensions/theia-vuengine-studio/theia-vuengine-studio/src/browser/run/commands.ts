import { Command } from "@theia/core";

export const VesRunCommand: Command = {
    id: "VesRun.commands.run",
    label: "Run on Emulator",
    category: "Run",
    iconClass: "fa fa-play",
};

export const VesSelectEmulatorCommand: Command = {
    id: "VesRun.commands.selectEmulator",
    label: "Select Default Emulator...",
    category: "Run"
};