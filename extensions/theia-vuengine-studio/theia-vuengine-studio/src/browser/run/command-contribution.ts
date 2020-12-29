import { inject, injectable, interfaces } from "inversify";
import {
  CommandContribution,
  CommandRegistry,
  CommandService,
  MessageService,
} from "@theia/core/lib/common";
import { TerminalService } from "@theia/terminal/lib/browser/base/terminal-service";
import { runCommand } from "./commands/run";
import { selectEmulatorCommand } from "./commands/selectEmulator";
import { PreferenceService } from "@theia/core/lib/browser";
import { VesStateModel } from "../common/vesStateModel";
import { VesRunCommand, VesSelectEmulatorCommand } from "./commands";

@injectable()
export class VesRunCommandContribution implements CommandContribution {
  constructor(
    @inject(CommandService) private readonly commandService: CommandService,
    @inject(MessageService) private readonly messageService: MessageService,
    @inject(PreferenceService)
    private readonly preferenceService: PreferenceService,
    @inject(TerminalService) private readonly terminalService: TerminalService,
    @inject(VesStateModel)
    private readonly vesState: VesStateModel,
  ) { }

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(VesRunCommand, {
      execute: () =>
        runCommand(
          this.commandService,
          this.preferenceService,
          this.terminalService,
          this.vesState
        ),
    });
    registry.registerCommand(VesSelectEmulatorCommand, {
      execute: () =>
        selectEmulatorCommand(
          this.messageService,
          this.preferenceService,
          this.terminalService
        ),
    });
  }
}

export function bindVesRunCommands(bind: interfaces.Bind): void {
  bind(CommandContribution).to(VesRunCommandContribution).inSingletonScope();
}