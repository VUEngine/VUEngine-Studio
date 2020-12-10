import { PreferenceService } from "@theia/core/lib/browser";
import { CommandService, MessageService } from "@theia/core/lib/common";
import { TerminalService } from "@theia/terminal/lib/browser/base/terminal-service";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { existsSync } from "fs";
import { VesBuildCommand } from "../../build/commands";
import { getRomPath } from "../../common";

export async function runCommand(
  commandService: CommandService,
  messageService: MessageService,
  preferenceService: PreferenceService,
  terminalService: TerminalService,
  workspaceService: WorkspaceService
) {
  const romPath = getRomPath(workspaceService);
  if (existsSync(romPath)) {
    run(messageService, preferenceService, terminalService, workspaceService);
  } else {
    commandService.executeCommand(VesBuildCommand.id);
    // TODO queue run
  }
}

async function run(
  messageService: MessageService,
  preferenceService: PreferenceService,
  terminalService: TerminalService,
  workspaceService: WorkspaceService
) {}
