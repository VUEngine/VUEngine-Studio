import * as electron from 'electron';
import { injectable } from "inversify";
import { Command, CommandContribution, CommandRegistry } from "@theia/core/lib/common";

export const VesMinimizeWindowCommand: Command = {
  id: "VesTopbar.commands.minimizeWindow",
  label: "Minimize Window",
  iconClass: "window-minimize",
};

export const VesMaximizeWindowCommand: Command = {
  id: "VesTopbar.commands.maximizeWindow",
  label: "Maximize Window",
  iconClass: "window-maximize",
};

export const VesUnmaximizeWindowCommand: Command = {
  id: "VesTopbar.commands.unmaximizeWindow",
  label: "Unmaximize Window",
  iconClass: "window-unmaximize",
};

@injectable()
export class VesWindowCommandContribution implements CommandContribution {
  registerCommands(registry: CommandRegistry): void {
    const currentWindow = electron.remote.getCurrentWindow();
    registry.registerCommand(VesMinimizeWindowCommand, {
      execute: () => currentWindow.minimize()
    });
    registry.registerCommand(VesMaximizeWindowCommand, {
      execute: () => currentWindow.maximize()
    });
    registry.registerCommand(VesUnmaximizeWindowCommand, {
      execute: () => currentWindow.unmaximize()
    });
  }
}
