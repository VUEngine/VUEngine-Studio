import { inject, injectable, interfaces } from "inversify";
import { Command, CommandContribution, CommandRegistry } from "@theia/core/lib/common";
import { VesCommonFunctions } from "../common/common-functions";
import { VesUrls } from "../common/common-urls";

export const VesSupportUsCommand: Command = {
  id: "Ves.commands.supportUs",
  label: "Support Us...",
  category: "Help",
  iconClass: "info",
};

@injectable()
export class VesSupportUsCommandContribution implements CommandContribution {
  @inject(VesCommonFunctions) protected readonly commonFunctions: VesCommonFunctions;

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(VesSupportUsCommand, {
      execute: () => this.commonFunctions.openUrl(VesUrls.PATREON),
    });
  }
}

export function bindVesSupportUsCommands(bind: interfaces.Bind): void {
  bind(CommandContribution).to(VesSupportUsCommandContribution).inSingletonScope();
}
