import { inject, injectable, interfaces } from "inversify";
import { CommandContribution, CommandRegistry } from "@theia/core/lib/common";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { VesFlashCartsFlashCommand } from "./commands/flash";
import { VesFlashCartsCommands } from "./flash-carts-commands";
import { VesFlashCartsOpenWidgetCommand } from "./commands/show-flash-carts-widget";
import { VesFlashCartsDetectCommand } from "./commands/detect-connected-flash-carts";

@injectable()
export class VesFlashCartsCommandContribution implements CommandContribution {
  constructor(
    @inject(VesFlashCartsDetectCommand) private readonly detectCommand: VesFlashCartsDetectCommand,
    @inject(VesFlashCartsFlashCommand) private readonly flashCommand: VesFlashCartsFlashCommand,
    @inject(VesFlashCartsOpenWidgetCommand) private readonly openWidgetCommand: VesFlashCartsOpenWidgetCommand,
    @inject(WorkspaceService) private readonly workspaceService: WorkspaceService,
  ) { }

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(VesFlashCartsCommands.FLASH, {
      isVisible: () => this.workspaceService.opened,
      execute: () => this.flashCommand.execute(),
    });

    commandRegistry.registerCommand(VesFlashCartsCommands.OPEN_WIDGET, {
      execute: (forceOpen: boolean = false) => this.openWidgetCommand.execute(forceOpen),
    });

    commandRegistry.registerCommand(VesFlashCartsCommands.DETECT, {
      execute: () => this.detectCommand.execute(),
    });
  }
}

export function bindVesFlashCartsCommands(bind: interfaces.Bind): void {
  bind(VesFlashCartsDetectCommand).toSelf().inSingletonScope();
  bind(VesFlashCartsFlashCommand).toSelf().inSingletonScope();
  bind(VesFlashCartsOpenWidgetCommand).toSelf().inSingletonScope();
  bind(CommandContribution).to(VesFlashCartsCommandContribution).inSingletonScope();
}
