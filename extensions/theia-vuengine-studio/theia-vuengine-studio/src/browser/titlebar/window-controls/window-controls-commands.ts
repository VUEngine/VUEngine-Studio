import * as electron from 'electron';
import { injectable, interfaces } from "inversify";
import { Command, CommandContribution, CommandRegistry } from "@theia/core/lib/common";

export const VesMinimizeWindowCommand: Command = {
  id: "VesTitlebar.commands.minimizeWindow",
  label: "Minimize Window",
  iconClass: "window-minimize",
};

export const VesMaximizeWindowCommand: Command = {
  id: "VesTitlebar.commands.maximizeWindow",
  label: "Maximize Window",
  iconClass: "window-maximize",
};

export const VesUnmaximizeWindowCommand: Command = {
  id: "VesTitlebar.commands.unmaximizeWindow",
  label: "Unmaximize Window",
  iconClass: "window-unmaximize",
};

@injectable()
export class VesWindowControlsCommandContribution implements CommandContribution {
  registerCommands(commandRegistry: CommandRegistry): void {
    const currentWindow = electron.remote.getCurrentWindow();
    commandRegistry.registerCommand(VesMinimizeWindowCommand, {
      execute: () => currentWindow.minimize()
    });
    commandRegistry.registerCommand(VesMaximizeWindowCommand, {
      execute: () => currentWindow.maximize()
    });
    commandRegistry.registerCommand(VesUnmaximizeWindowCommand, {
      execute: () => currentWindow.unmaximize()
    });
  }
}

export function bindVesWindowControlsCommands(bind: interfaces.Bind): void {
  bind(CommandContribution).to(VesWindowControlsCommandContribution).inSingletonScope();
}
