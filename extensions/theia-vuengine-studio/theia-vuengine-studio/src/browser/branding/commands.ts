import { inject, injectable } from "inversify";
import {
  Command,
  CommandContribution,
  CommandRegistry,
  CommandService,
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
  constructor(
    @inject(CommandService) private readonly commandService: CommandService,
  ) { }

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(VesSupportUsCommand, {
      execute: () => supportUsCommand(this.commandService)
    });
  }
}
