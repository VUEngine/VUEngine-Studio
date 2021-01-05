import { inject, injectable, interfaces } from "inversify";
import { CommandContribution, CommandRegistry } from "@theia/core/lib/common";
import { VesProjectsCommands } from "./commands";
import { VesNewProjectDialog } from "./new-project-dialog";

@injectable()
export class VesProjectsCommandContribution implements CommandContribution {
  constructor(
    @inject(VesNewProjectDialog) private readonly vesNewProjectDialog: VesNewProjectDialog,
  ) { }

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(VesProjectsCommands.NEW, {
      execute: () => !this.vesNewProjectDialog.isVisible && this.vesNewProjectDialog.open()
    });
  }
}

export function bindVesProjectsCommands(bind: interfaces.Bind): void {
  bind(CommandContribution).to(VesProjectsCommandContribution).inSingletonScope();
}