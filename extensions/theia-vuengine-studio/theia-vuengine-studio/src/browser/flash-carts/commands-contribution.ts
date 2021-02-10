import { inject, injectable, interfaces } from "inversify";
import { CommandContribution, CommandRegistry, CommandService, MessageService } from "@theia/core/lib/common";
import { TerminalService } from "@theia/terminal/lib/browser/base/terminal-service";
import { flashCommand } from "./commands/flash";
import { PreferenceService } from "@theia/core/lib/browser";
import { VesStateModel } from "../common/vesStateModel";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { VesFlashCartsCommand } from "./commands";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { VesProcessService } from "../../common/process-service-protocol";
import { VesProcessWatcher } from "../services/process-service/process-watcher";

@injectable()
export class VesFlashCartsCommandContribution implements CommandContribution {
  constructor(
    @inject(CommandService) private readonly commandService: CommandService,
    @inject(FileService) private readonly fileService: FileService,
    @inject(MessageService) private readonly messageService: MessageService,
    @inject(PreferenceService) private readonly preferenceService: PreferenceService,
    @inject(TerminalService) private readonly terminalService: TerminalService,
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
          this.terminalService,
          this.vesProcessService,
          this.vesProcessWatcher,
          this.vesState,
        ),
    });
  }
}

export function bindVesFlashCartsCommands(bind: interfaces.Bind): void {
  bind(CommandContribution).to(VesFlashCartsCommandContribution).inSingletonScope();
}
