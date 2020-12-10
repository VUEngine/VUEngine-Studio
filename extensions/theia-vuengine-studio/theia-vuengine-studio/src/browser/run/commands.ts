import { inject, injectable } from "inversify";
import {
  Command,
  CommandContribution,
  CommandRegistry,
  CommandService,
  MessageService,
} from "@theia/core/lib/common";
import { TerminalService } from "@theia/terminal/lib/browser/base/terminal-service";
import { runCommand } from "./commands/run";
import { selectEmulatorCommand } from "./commands/selectEmulator";
import { PreferenceService } from "@theia/core/lib/browser";
import { WorkspaceService } from "@theia/workspace/lib/browser";

export const VesRunCommand: Command = {
  id: "VesRun.commands.run",
  // TODO: dynamic label based on selected emu config?"
  label: "Run on Emulator",
  category: "Run",
  iconClass: "play",
};

export const VesSelectEmulatorCommand: Command = {
  id: "VesRun.commands.selectEmulator",
  label: "Select Default Emulator...",
  category: "Run",
  iconClass: "select",
};

@injectable()
export class VesRunCommandContribution implements CommandContribution {
  constructor(
    @inject(CommandService) private readonly commandService: CommandService,
    @inject(MessageService) private readonly messageService: MessageService,
    @inject(PreferenceService)
    private readonly preferenceService: PreferenceService,
    @inject(TerminalService) private readonly terminalService: TerminalService,
    @inject(WorkspaceService)
    private readonly workspaceService: WorkspaceService
  ) {}

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(VesRunCommand, {
      execute: () =>
        runCommand(
          this.commandService,
          this.messageService,
          this.preferenceService,
          this.terminalService,
          this.workspaceService
        ),
    });
    registry.registerCommand(VesSelectEmulatorCommand, {
      execute: () =>
        selectEmulatorCommand(
          this.messageService,
          this.preferenceService,
          this.terminalService,
          this.workspaceService
        ),
    });
  }
}
