import { PreferenceService } from "@theia/core/lib/browser";
import { MessageService } from "@theia/core/lib/common";
import { TerminalService } from "@theia/terminal/lib/browser/base/terminal-service";
import { WorkspaceService } from "@theia/workspace/lib/browser";

export async function selectEmulatorCommand(
  messageService: MessageService,
  preferenceService: PreferenceService,
  terminalService: TerminalService,
  workspaceService: WorkspaceService
) {
  selectEmulator(
    messageService,
    preferenceService,
    terminalService,
    workspaceService
  );
}

async function selectEmulator(
  messageService: MessageService,
  preferenceService: PreferenceService,
  terminalService: TerminalService,
  workspaceService: WorkspaceService
) {
}
