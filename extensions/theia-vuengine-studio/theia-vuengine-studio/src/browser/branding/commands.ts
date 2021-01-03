import { injectable, interfaces } from "inversify";
import {
  Command,
  CommandContribution,
  CommandRegistry,
} from "@theia/core/lib/common";
import { supportUsCommand } from "./commands/supportUs";

export const VesSupportUsCommand: Command = {
  id: "Ves.commands.supportUs",
  label: "Support Us...",
  category: "Help",
  iconClass: "info",
};

@injectable()
export class VesBrandingCommandContribution implements CommandContribution {
  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(VesSupportUsCommand, {
      execute: () => supportUsCommand()
    });
  }
}

export function bindVesBrandingCommands(bind: interfaces.Bind): void {
  bind(CommandContribution).to(VesBrandingCommandContribution).inSingletonScope();
}
