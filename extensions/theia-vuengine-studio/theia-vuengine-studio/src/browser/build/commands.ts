import { inject, injectable } from "inversify";
import {
  Command,
  CommandContribution,
  CommandRegistry,
  CommandService,
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

export const VesBuildCommand: Command = {
  id: "VesBuild.commands.build",
  label: "Build Project",
  category: "Build",
  iconClass: "wrench",
};

export const VesBuildCleanCommand: Command = {
  id: "VesBuild.commands.clean",
  label: "Clean Build Folder",
  category: "Build",
  iconClass: "remove",
};

export const VesBuildExportCommand: Command = {
  id: "VesBuild.commands.export",
  label: "Export ROM...",
  category: "Build",
  iconClass: "save",
};

export const VesBuildSetModeReleaseCommand: Command = {
  id: "VesBuild.commands.setMode.release",
  label: `Set Build Mode to "release"`,
  category: "Build",
  iconClass: "mode",
};
export const VesBuildSetModeBetaCommand: Command = {
  id: "VesBuild.commands.setMode.beta",
  label: `Set Build Mode to "beta"`,
  category: "Build",
  iconClass: "mode",
};
export const VesBuildSetModeToolsCommand: Command = {
  id: "VesBuild.commands.setMode.tools",
  label: `Set Build Mode to "tools"`,
  category: "Build",
  iconClass: "mode",
};
export const VesBuildSetModeDebugCommand: Command = {
  id: "VesBuild.commands.setMode.debug",
  label: `Set Build Mode to "debug"`,
  category: "Build",
  iconClass: "mode",
};
export const VesBuildSetModePreprocessorCommand: Command = {
  id: "VesBuild.commands.setMode.preprocessor",
  label: `Set Build Mode to "preprocessor"`,
  category: "Build",
  iconClass: "mode",
};

export const VesBuildEnableDumpElfCommand: Command = {
  id: "VesBuild.commands.dumpElf.enable",
  label: "Enable Dump ELF",
  category: "Build",
};
export const VesBuildDisableDumpElfCommand: Command = {
  id: "VesBuild.commands.dumpElf.disable",
  label: "Disable Dump ELF",
  category: "Build",
};
export const VesBuildEnablePedanticWarningsCommand: Command = {
  id: "VesBuild.commands.pedanticWarnings.enable",
  label: "Enable Pedantic Warnings",
  category: "Build",
};
export const VesBuildDisablePedanticWarningsCommand: Command = {
  id: "VesBuild.commands.pedanticWarnings.disable",
  label: "Disable Pedantic Warnings",
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
    private readonly vesStateModel: VesStateModel,
    @inject(WorkspaceService)
    private readonly workspaceService: WorkspaceService
  ) { }

  registerCommands(registry: CommandRegistry): void {
    const buildMode = <string>this.preferenceService.get("build.buildMode");
    const dumpElf = <boolean>this.preferenceService.get("build.dumpElf");
    const pedanticWarnings = <boolean>(
      this.preferenceService.get("build.pedanticWarnings")
    );

    registry.registerCommand(VesBuildCommand, {
      execute: () =>
        buildCommand(
          this.preferenceService,
          this.terminalService,
          this.vesStateModel,
          this.workspaceService
        ),
    });
    registry.registerCommand(VesBuildCleanCommand, {
      execute: () =>
        cleanCommand(
          this.messageService,
          this.quickPickService,
          this.vesStateModel,
          this.workspaceService
        ),
    });
    registry.registerCommand(VesBuildExportCommand, {
      execute: () =>
        exportCommand(
          this.commandService,
          this.fileService,
          this.fileDialogService,
          this.vesStateModel,
          this.workspaceService
        ),
    });

    registry.registerCommand(VesBuildSetModeReleaseCommand, {
      execute: () => setModeCommand(this.preferenceService, BuildMode.release),
      isEnabled: () => buildMode !== BuildMode.release,
      isToggled: () => buildMode === BuildMode.release,
    });
    registry.registerCommand(VesBuildSetModeBetaCommand, {
      execute: () => setModeCommand(this.preferenceService, BuildMode.beta),
      isEnabled: () => buildMode !== BuildMode.beta,
      isToggled: () => buildMode === BuildMode.beta,
    });
    registry.registerCommand(VesBuildSetModeToolsCommand, {
      execute: () => setModeCommand(this.preferenceService, BuildMode.tools),
      isEnabled: () => buildMode !== BuildMode.tools,
      isToggled: () => buildMode === BuildMode.tools,
    });
    registry.registerCommand(VesBuildSetModeDebugCommand, {
      execute: () => setModeCommand(this.preferenceService, BuildMode.debug),
      isEnabled: () => buildMode !== BuildMode.debug,
      isToggled: () => buildMode === BuildMode.debug,
    });
    registry.registerCommand(VesBuildSetModePreprocessorCommand, {
      execute: () =>
        setModeCommand(this.preferenceService, BuildMode.preprocessor),
      isEnabled: () => buildMode !== BuildMode.preprocessor,
      isToggled: () => buildMode === BuildMode.preprocessor,
    });

    registry.registerCommand(VesBuildEnableDumpElfCommand, {
      execute: () => toggleDumpElf(this.preferenceService, true),
      isToggled: () => false,
      isVisible: () => !dumpElf,
    });
    registry.registerCommand(VesBuildDisableDumpElfCommand, {
      execute: () => toggleDumpElf(this.preferenceService, false),
      isToggled: () => true,
      isVisible: () => !!dumpElf,
    });

    registry.registerCommand(VesBuildEnablePedanticWarningsCommand, {
      execute: () => togglePedanticWarnings(this.preferenceService, true),
      isToggled: () => false,
      isVisible: () => !pedanticWarnings,
    });
    registry.registerCommand(VesBuildDisablePedanticWarningsCommand, {
      execute: () => togglePedanticWarnings(this.preferenceService, false),
      isToggled: () => true,
      isVisible: () => !!pedanticWarnings,
    });
  }
}
