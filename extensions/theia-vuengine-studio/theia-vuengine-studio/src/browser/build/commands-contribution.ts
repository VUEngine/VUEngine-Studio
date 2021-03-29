import { inject, injectable, interfaces } from "inversify";
import {
  CommandContribution,
  CommandRegistry,
  CommandService,
  isWindows,
  MessageService,
} from "@theia/core/lib/common";
import { QuickPickService } from "@theia/core/lib/common/quick-pick-service";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { PreferenceService, StorageService } from "@theia/core/lib/browser";
import { FileDialogService } from "@theia/filesystem/lib/browser";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { buildCommand } from "./commands/build";
import { exportCommand } from "./commands/export";
import { setModeCommand } from "./commands/setMode";
import { cleanCommand } from "./commands/clean";
import { toggleDumpElf } from "./commands/toggleDumpElf";
import { togglePedanticWarnings } from "./commands/togglePedanticWarnings";
import { VesStateModel } from "../common/vesStateModel";
import { toggleEnableWsl } from "./commands/toggleEnableWSL";
import { VesBuildCleanCommand, VesBuildCommand, VesBuildExportCommand, VesBuildSetModeCommand, VesBuildToggleDumpElfCommand, VesBuildToggleEnableWslCommand, VesBuildTogglePedanticWarningsCommand, VesBuildOpenWidgetCommand } from "./commands";
import { VesBuildDumpElfPreference, VesBuildEnableWslPreference, VesBuildPedanticWarningsPreference } from "./preferences";
import { VesProcessService } from "../../common/process-service-protocol";
import { VesProcessWatcher } from "../services/process-service/process-watcher";
import { VesBuildWidgetContribution } from "./widget/build-view";
import { showBuildWidgetCommand } from "./commands/showBuildWidget";
import { BuildMode } from "./types";

@injectable()
export class VesBuildCommandContribution implements CommandContribution {
  constructor(
    @inject(VesBuildWidgetContribution) private readonly vesBuildWidget: VesBuildWidgetContribution,
    @inject(CommandService) private readonly commandService: CommandService,
    @inject(FileService) private readonly fileService: FileService,
    @inject(FileDialogService) private readonly fileDialogService: FileDialogService,
    @inject(MessageService) private readonly messageService: MessageService,
    @inject(PreferenceService) private readonly preferenceService: PreferenceService,
    @inject(StorageService) private readonly storageService: StorageService,
    @inject(QuickPickService) private readonly quickPickService: QuickPickService,
    @inject(VesProcessService) private readonly vesProcessService: VesProcessService,
    @inject(VesProcessWatcher) private readonly vesProcessWatcher: VesProcessWatcher,
    @inject(VesStateModel) private readonly vesState: VesStateModel,
    @inject(WorkspaceService) private readonly workspaceService: WorkspaceService,
  ) { }

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(VesBuildCleanCommand, {
      isVisible: () => this.workspaceService.opened,
      execute: () =>
        cleanCommand(
          this.messageService,
          this.preferenceService,
          this.vesState,
        ),
    });
    commandRegistry.registerCommand(VesBuildCommand, {
      isVisible: () => this.workspaceService.opened,
      execute: () =>
        buildCommand(
          this.commandService,
          this.fileService,
          this.preferenceService,
          this.storageService,
          this.vesProcessService,
          this.vesProcessWatcher,
          this.vesState,
          this.workspaceService,
        ),
    });
    commandRegistry.registerCommand(VesBuildExportCommand, {
      isVisible: () => this.workspaceService.opened,
      execute: () =>
        exportCommand(
          this.commandService,
          this.fileService,
          this.fileDialogService,
          this.vesState,
        ),
    });

    commandRegistry.registerCommand(VesBuildSetModeCommand, {
      execute: (buildMode?: BuildMode) => setModeCommand(this.preferenceService, this.quickPickService, buildMode)
    });

    commandRegistry.registerCommand(VesBuildToggleDumpElfCommand, {
      execute: () => toggleDumpElf(this.preferenceService),
      isToggled: () => !!this.preferenceService.get(VesBuildDumpElfPreference.id),
    });

    commandRegistry.registerCommand(VesBuildTogglePedanticWarningsCommand, {
      execute: () => togglePedanticWarnings(this.preferenceService),
      isToggled: () => !!this.preferenceService.get(VesBuildPedanticWarningsPreference.id),
    });

    if (isWindows) {
      commandRegistry.registerCommand(VesBuildToggleEnableWslCommand, {
        execute: () => toggleEnableWsl(this.preferenceService),
        isToggled: () => !!this.preferenceService.get(VesBuildEnableWslPreference.id),
      });
    }

    commandRegistry.registerCommand(VesBuildOpenWidgetCommand, {
      execute: (forceOpen: boolean = false) =>
        showBuildWidgetCommand(
          forceOpen,
          this.vesBuildWidget,
        ),
    });
  }
}

export function bindVesBuildCommands(bind: interfaces.Bind): void {
  bind(CommandContribution).to(VesBuildCommandContribution).inSingletonScope();
}
