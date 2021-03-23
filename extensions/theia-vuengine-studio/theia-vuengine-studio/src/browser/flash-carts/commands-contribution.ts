import { inject, injectable, interfaces } from "inversify";
import { CommandContribution, CommandRegistry, CommandService, MessageService } from "@theia/core/lib/common";
import { flashCommand } from "./commands/flash";
import { PreferenceService } from "@theia/core/lib/browser";
import { VesStateModel } from "../common/vesStateModel";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { VesDetectConnectedFlashCartsCommand, VesFlashCartsCommand, VesOpenFlashCartsWidgetCommand } from "./commands";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { VesProcessService } from "../../common/process-service-protocol";
import { VesProcessWatcher } from "../services/process-service/process-watcher";
import { showFlashCartsWidgetCommand } from "./commands/showFlashCartsWidget";
import { VesFlashCartsWidgetContribution } from "./widget/flash-carts-view";
import { detectConnectedFlashCarts } from "./commands/detectConnectedFlashCarts";

@injectable()
export class VesFlashCartsCommandContribution implements CommandContribution {
  constructor(
    @inject(CommandService) private readonly commandService: CommandService,
    @inject(FileService) private readonly fileService: FileService,
    @inject(MessageService) private readonly messageService: MessageService,
    @inject(PreferenceService) private readonly preferenceService: PreferenceService,
    @inject(VesFlashCartsWidgetContribution) private readonly vesFlashCartsWidget: VesFlashCartsWidgetContribution,
    @inject(VesProcessService) private readonly vesProcessService: VesProcessService,
    @inject(VesProcessWatcher) private readonly vesProcessWatcher: VesProcessWatcher,
    @inject(VesStateModel) private readonly vesState: VesStateModel,
    @inject(WorkspaceService) private readonly workspaceService: WorkspaceService,
  ) { }

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(VesFlashCartsCommand, {
      isVisible: () => this.workspaceService.opened,
      execute: () =>
        flashCommand(
          this.commandService,
          this.fileService,
          this.messageService,
          this.preferenceService,
          this.vesProcessService,
          this.vesProcessWatcher,
          this.vesState,
        ),
    });

    commandRegistry.registerCommand(VesOpenFlashCartsWidgetCommand, {
      execute: (forceOpen: boolean = false) =>
        showFlashCartsWidgetCommand(
          forceOpen,
          this.vesFlashCartsWidget,
        ),
    });

    commandRegistry.registerCommand(VesDetectConnectedFlashCartsCommand, {
      execute: () =>
        detectConnectedFlashCarts(
          this.vesState,
        )
    });
  }
}

export function bindVesFlashCartsCommands(bind: interfaces.Bind): void {
  bind(CommandContribution).to(VesFlashCartsCommandContribution).inSingletonScope();
}
