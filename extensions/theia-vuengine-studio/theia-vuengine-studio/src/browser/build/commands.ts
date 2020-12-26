import { inject, injectable, interfaces } from "inversify";
import {
  Command,
  CommandContribution,
  CommandRegistry,
  CommandService,
  isWindows,
  MessageService,
} from "@theia/core/lib/common";
import { QuickPickService } from "@theia/core/lib/common/quick-pick-service";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { PreferenceService } from "@theia/core/lib/browser";
import { TerminalService } from "@theia/terminal/lib/browser/base/terminal-service";
import { FileDialogService } from "@theia/filesystem/lib/browser";
import { buildCommand } from "./commands/build";
import { exportCommand } from "./commands/export";
import { BuildMode, setModeCommand } from "./commands/setMode";
import { cleanCommand } from "./commands/clean";
import { toggleDumpElf } from "./commands/toggleDumpElf";
import { togglePedanticWarnings } from "./commands/togglePedanticWarnings";
import { VesStateModel } from "../common/vesStateModel";
import { toggleEnableWsl } from "./commands/toggleEnableWSL";

export const VesBuildCommand: Command = {
  id: "VesBuild.commands.build",
  label: "Build Project",
  category: "Build",
  iconClass: "fa fa-wrench",
};

export const VesBuildCleanCommand: Command = {
  id: "VesBuild.commands.clean",
  label: "Clean Build Folder",
  category: "Build",
  iconClass: "fa fa-trash",
};

export const VesBuildExportCommand: Command = {
  id: "VesBuild.commands.export",
  label: "Export ROM...",
  category: "Build",
  iconClass: "fa fa-share-square",
};

export const VesBuildSetModeCommand: Command = {
  id: "VesBuild.commands.setMode",
  label: `Set Build Mode`,
  category: "Build",
};
export const VesBuildSetModeReleaseCommand: Command = {
  id: "VesBuild.commands.setMode.release",
  label: `Set Build Mode to "release"`,
  category: "Build"
};
export const VesBuildSetModeBetaCommand: Command = {
  id: "VesBuild.commands.setMode.beta",
  label: `Set Build Mode to "beta"`,
  category: "Build",
};
export const VesBuildSetModeToolsCommand: Command = {
  id: "VesBuild.commands.setMode.tools",
  label: `Set Build Mode to "tools"`,
  category: "Build",
};
export const VesBuildSetModeDebugCommand: Command = {
  id: "VesBuild.commands.setMode.debug",
  label: `Set Build Mode to "debug"`,
  category: "Build",
};
export const VesBuildSetModePreprocessorCommand: Command = {
  id: "VesBuild.commands.setMode.preprocessor",
  label: `Set Build Mode to "preprocessor"`,
  category: "Build",
};

export const VesBuildToggleDumpElfCommand: Command = {
  id: "VesBuild.commands.dumpElf.toggle",
  label: "Toggle Dump ELF",
  category: "Build",
};
export const VesBuildTogglePedanticWarningsCommand: Command = {
  id: "VesBuild.commands.pedanticWarnings.toggle",
  label: "Toggle Pedantic Warnings",
  category: "Build",
};
export const VesBuildToggleEnableWslCommand: Command = {
  id: "VesBuild.commands.enableWsl.toggle",
  label: "Toggle use WSL for building",
  category: "Build",
};

@injectable()
export class VesBuildCommandContribution implements CommandContribution {
  constructor(
    @inject(CommandService) private readonly commandService: CommandService,
    @inject(FileService) private readonly fileService: FileService,
    @inject(FileDialogService)
    private readonly fileDialogService: FileDialogService,
    @inject(MessageService) private readonly messageService: MessageService,
    @inject(PreferenceService)
    private readonly preferenceService: PreferenceService,
    @inject(TerminalService) private readonly terminalService: TerminalService,
    @inject(QuickPickService)
    private readonly quickPickService: QuickPickService,
    @inject(VesStateModel)
    private readonly vesState: VesStateModel,
    @inject(WorkspaceService)
    private readonly workspaceService: WorkspaceService
  ) { }

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(VesBuildCleanCommand, {
      execute: () =>
        cleanCommand(
          this.fileService,
          this.messageService,
          this.preferenceService,
          this.quickPickService,
          this.vesState,
          this.workspaceService
        ),
    });
    registry.registerCommand(VesBuildCommand, {
      execute: () =>
        buildCommand(
          this.fileService,
          this.preferenceService,
          this.terminalService,
          this.vesState,
          this.workspaceService
        ),
    });
    registry.registerCommand(VesBuildExportCommand, {
      execute: () =>
        exportCommand(
          this.commandService,
          this.fileService,
          this.fileDialogService,
          this.vesState,
          this.workspaceService
        ),
    });

    registry.registerCommand(VesBuildSetModeCommand, {
      execute: () => setModeCommand(this.preferenceService, this.quickPickService)
    });
    registry.registerCommand(VesBuildSetModeReleaseCommand, {
      execute: () => setModeCommand(this.preferenceService, this.quickPickService, BuildMode.release),
      isToggled: () => this.preferenceService.get("build.buildMode") == BuildMode.release
    });
    registry.registerCommand(VesBuildSetModeBetaCommand, {
      execute: () => setModeCommand(this.preferenceService, this.quickPickService, BuildMode.beta),
      isToggled: () => this.preferenceService.get("build.buildMode") == BuildMode.beta,
    });
    registry.registerCommand(VesBuildSetModeToolsCommand, {
      execute: () => setModeCommand(this.preferenceService, this.quickPickService, BuildMode.tools),
      isToggled: () => this.preferenceService.get("build.buildMode") == BuildMode.tools,
    });
    registry.registerCommand(VesBuildSetModeDebugCommand, {
      execute: () => setModeCommand(this.preferenceService, this.quickPickService, BuildMode.debug),
      isToggled: () => this.preferenceService.get("build.buildMode") == BuildMode.debug,
    });
    registry.registerCommand(VesBuildSetModePreprocessorCommand, {
      execute: () => setModeCommand(this.preferenceService, this.quickPickService, BuildMode.preprocessor),
      isToggled: () => this.preferenceService.get("build.buildMode") == BuildMode.preprocessor,
    });

    registry.registerCommand(VesBuildToggleDumpElfCommand, {
      execute: () => toggleDumpElf(this.preferenceService),
      isToggled: () => !!this.preferenceService.get("build.dumpElf"),
    });

    registry.registerCommand(VesBuildTogglePedanticWarningsCommand, {
      execute: () => togglePedanticWarnings(this.preferenceService),
      isToggled: () => !!this.preferenceService.get("build.pedanticWarnings"),
    });

    if (isWindows) {
      registry.registerCommand(VesBuildToggleEnableWslCommand, {
        execute: () => toggleEnableWsl(this.preferenceService),
        isToggled: () => !!this.preferenceService.get("build.enableWsl"),
      });
    }
  }
}

export function bindVesBuildCommands(bind: interfaces.Bind): void {
  bind(CommandContribution).to(VesBuildCommandContribution).inSingletonScope();
}
