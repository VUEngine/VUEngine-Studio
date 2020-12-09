import {
  inject,
  injectable,
} from "inversify";
import {
  Command,
  CommandContribution,
  CommandRegistry,
  CommandService,
  MessageService
} from "@theia/core/lib/common";
import { cleanCommand } from "./commands/clean";
import { QuickPickService } from "@theia/core/lib/common/quick-pick-service";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { buildCommand } from "./commands/build";
import { PreferenceService } from "@theia/core/lib/browser";
import { TerminalService } from "@theia/terminal/lib/browser/base/terminal-service";
import { exportCommand } from "./commands/export";
import { FileDialogService } from "@theia/filesystem/lib/browser";
import { FileService } from "@theia/filesystem/lib/browser/file-service";

export const VesBuildCommand: Command = {
  id: "VesBuild.commands.build",
  label: "Build project",
  category: "Build",
  iconClass: "wrench",
};

export const VesBuildCleanCommand: Command = {
  id: "VesBuild.commands.clean",
  label: "Clean build folder",
  category: "Build",
  iconClass: "remove",
};

export const VesBuildExportCommand: Command = {
  id: "VesBuild.commands.export",
  label: "Export ROM",
  category: "Build",
  iconClass: "save",
};

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
    @inject(WorkspaceService) private readonly workspaceService: WorkspaceService,
  ) { }

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(VesBuildCommand, {
      execute: () => buildCommand(this.preferenceService, this.terminalService, this.workspaceService),
    });
    registry.registerCommand(VesBuildCleanCommand, {
      execute: () => cleanCommand(this.messageService, this.quickPickService, this.workspaceService),
    });
    registry.registerCommand(VesBuildExportCommand, {
      execute: () => exportCommand(this.commandService, this.fileService, this.fileDialogService, this.preferenceService, this.workspaceService),
    });
  }
}
