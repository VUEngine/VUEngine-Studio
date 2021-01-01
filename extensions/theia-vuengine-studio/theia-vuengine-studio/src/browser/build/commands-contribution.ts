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
import { PreferenceService } from "@theia/core/lib/browser";
import { TerminalService } from "@theia/terminal/lib/browser/base/terminal-service";
import { FileDialogService } from "@theia/filesystem/lib/browser";
import { buildCommand } from "./commands/build";
import { exportCommand } from "./commands/export";
import { setModeCommand } from "./commands/setMode";
import { BuildMode } from "./types";
import { cleanCommand } from "./commands/clean";
import { toggleDumpElf } from "./commands/toggleDumpElf";
import { togglePedanticWarnings } from "./commands/togglePedanticWarnings";
import { VesStateModel } from "../common/vesStateModel";
import { toggleEnableWsl } from "./commands/toggleEnableWSL";
import { VesBuildCleanCommand, VesBuildCommand, VesBuildExportCommand, VesBuildSetModeBetaCommand, VesBuildSetModeCommand, VesBuildSetModeDebugCommand, VesBuildSetModePreprocessorCommand, VesBuildSetModeReleaseCommand, VesBuildSetModeToolsCommand, VesBuildToggleDumpElfCommand, VesBuildToggleEnableWslCommand, VesBuildTogglePedanticWarningsCommand } from "./commands";
import { VesBuildDumpElfPreference, VesBuildEnableWslPreference, VesBuildModePreference, VesBuildPedanticWarningsPreference } from "./preferences";
import { VesProcessService } from "../../common/process-service-protocol";

@injectable()
export class VesBuildCommandContribution implements CommandContribution {
  constructor(
    @inject(CommandService) private readonly commandService: CommandService,
    @inject(FileService) private readonly fileService: FileService,
    @inject(FileDialogService) private readonly fileDialogService: FileDialogService,
    @inject(MessageService) private readonly messageService: MessageService,
    @inject(PreferenceService) private readonly preferenceService: PreferenceService,
    @inject(TerminalService) private readonly terminalService: TerminalService,
    @inject(QuickPickService) private readonly quickPickService: QuickPickService,
    @inject(VesProcessService) private readonly vesProcessService: VesProcessService,
    @inject(VesStateModel) private readonly vesState: VesStateModel,
  ) { }

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(VesBuildCleanCommand, {
      execute: () =>
        cleanCommand(
          this.fileService,
          this.messageService,
          this.preferenceService,
          this.quickPickService,
          this.vesState
        ),
    });
    registry.registerCommand(VesBuildCommand, {
      execute: () =>
        buildCommand(
          this.fileService,
          this.preferenceService,
          this.terminalService,
          this.vesProcessService,
          this.vesState
        ),
    });
    registry.registerCommand(VesBuildExportCommand, {
      execute: () =>
        exportCommand(
          this.commandService,
          this.fileService,
          this.fileDialogService,
          this.vesState
        ),
    });

    registry.registerCommand(VesBuildSetModeCommand, {
      execute: () => setModeCommand(this.preferenceService, this.quickPickService)
    });
    registry.registerCommand(VesBuildSetModeReleaseCommand, {
      execute: () => setModeCommand(this.preferenceService, this.quickPickService, BuildMode.release),
      isToggled: () => this.preferenceService.get(VesBuildModePreference.id) == BuildMode.release
    });
    registry.registerCommand(VesBuildSetModeBetaCommand, {
      execute: () => setModeCommand(this.preferenceService, this.quickPickService, BuildMode.beta),
      isToggled: () => this.preferenceService.get(VesBuildModePreference.id) == BuildMode.beta,
    });
    registry.registerCommand(VesBuildSetModeToolsCommand, {
      execute: () => setModeCommand(this.preferenceService, this.quickPickService, BuildMode.tools),
      isToggled: () => this.preferenceService.get(VesBuildModePreference.id) == BuildMode.tools,
    });
    registry.registerCommand(VesBuildSetModeDebugCommand, {
      execute: () => setModeCommand(this.preferenceService, this.quickPickService, BuildMode.debug),
      isToggled: () => this.preferenceService.get(VesBuildModePreference.id) == BuildMode.debug,
    });
    registry.registerCommand(VesBuildSetModePreprocessorCommand, {
      execute: () => setModeCommand(this.preferenceService, this.quickPickService, BuildMode.preprocessor),
      isToggled: () => this.preferenceService.get(VesBuildModePreference.id) == BuildMode.preprocessor,
    });

    registry.registerCommand(VesBuildToggleDumpElfCommand, {
      execute: () => toggleDumpElf(this.preferenceService),
      isToggled: () => !!this.preferenceService.get(VesBuildDumpElfPreference.id),
    });

    registry.registerCommand(VesBuildTogglePedanticWarningsCommand, {
      execute: () => togglePedanticWarnings(this.preferenceService),
      isToggled: () => !!this.preferenceService.get(VesBuildPedanticWarningsPreference.id),
    });

    if (isWindows) {
      registry.registerCommand(VesBuildToggleEnableWslCommand, {
        execute: () => toggleEnableWsl(this.preferenceService),
        isToggled: () => !!this.preferenceService.get(VesBuildEnableWslPreference.id),
      });
    }
  }
}

export function bindVesBuildCommands(bind: interfaces.Bind): void {
  bind(CommandContribution).to(VesBuildCommandContribution).inSingletonScope();
}
