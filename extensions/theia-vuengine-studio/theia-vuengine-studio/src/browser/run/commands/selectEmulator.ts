import { PreferenceService } from "@theia/core/lib/browser";
import { MessageService } from "@theia/core/lib/common";
import { TerminalService } from "@theia/terminal/lib/browser/base/terminal-service";

export async function selectEmulatorCommand(
  messageService: MessageService,
  preferenceService: PreferenceService,
  terminalService: TerminalService
) {
  selectEmulator(
    messageService,
    preferenceService,
    terminalService
  );
}

async function selectEmulator(
  messageService: MessageService,
  preferenceService: PreferenceService,
  terminalService: TerminalService
) {
}
