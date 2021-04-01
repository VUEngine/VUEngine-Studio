import { injectable, interfaces } from "inversify";
import { Command, CommandContribution, CommandRegistry } from "@theia/core/lib/common";
import { supportUsCommand } from "./commands/support-us";

export const VesSupportUsCommand: Command = {
  id: "Ves.commands.supportUs",
  label: "Support Us...",
  category: "Help",
  iconClass: "info",
};

@injectable()
export class VesSupportUsCommandContribution implements CommandContribution {
  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(VesSupportUsCommand, {
      execute: () => supportUsCommand()
    });
  }
}

export function bindVesSupportUsCommands(bind: interfaces.Bind): void {
  bind(CommandContribution).to(VesSupportUsCommandContribution).inSingletonScope();
}
