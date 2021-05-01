import { inject, injectable, interfaces } from "inversify";
import { CommandContribution, CommandRegistry } from "@theia/core/lib/common";
import { ApplicationShell } from "@theia/core/lib/browser";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { VesEmulatorCommands } from "./emulator-commands";
import { VesEmulatorRunCommand } from "./commands/runInEmulator";
import { VesEmulatorSelectCommand } from "./commands/selectEmulator";

@injectable()
export class VesRunCommandContribution implements CommandContribution {
  constructor(
    @inject(ApplicationShell) protected readonly shell: ApplicationShell,
    @inject(VesEmulatorRunCommand) private readonly runCommand: VesEmulatorRunCommand,
    @inject(VesEmulatorSelectCommand) private readonly selectCommand: VesEmulatorSelectCommand,
    @inject(WorkspaceService) private readonly workspaceService: WorkspaceService
  ) { }

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(VesEmulatorCommands.RUN, {
      isVisible: () => this.workspaceService.opened,
      execute: () => this.runCommand.execute(),
    });
    commandRegistry.registerCommand(VesEmulatorCommands.SELECT, {
      execute: () => this.selectCommand.execute(),
    });

    commandRegistry.registerCommand(VesEmulatorCommands.INPUT_L_UP, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorCommands.INPUT_L_RIGHT, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorCommands.INPUT_L_DOWN, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorCommands.INPUT_L_LEFT, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorCommands.INPUT_START, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorCommands.INPUT_SELECT, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorCommands.INPUT_L_TRIGGER, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorCommands.INPUT_R_UP, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorCommands.INPUT_R_RIGHT, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorCommands.INPUT_R_DOWN, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorCommands.INPUT_R_LEFT, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorCommands.INPUT_B, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorCommands.INPUT_A, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorCommands.INPUT_R_TRIGGER, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorCommands.INPUT_SAVE_STATE, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorCommands.INPUT_LOAD_STATE, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorCommands.INPUT_STATE_SLOT_DECREASE, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorCommands.INPUT_STATE_SLOT_INCREASE, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorCommands.INPUT_TOGGLE_FAST_FORWARD, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorCommands.INPUT_PAUSE_TOGGLE, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorCommands.INPUT_TOGGLE_SLOWMOTION, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorCommands.INPUT_REWIND, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorCommands.INPUT_FRAME_ADVANCE, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorCommands.INPUT_RESET, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorCommands.INPUT_AUDIO_MUTE, {
      execute: () => { },
      isVisible: () => false,
    });
  }
}

export function bindVesRunCommands(bind: interfaces.Bind): void {
  bind(VesEmulatorRunCommand).toSelf().inSingletonScope();
  bind(VesEmulatorSelectCommand).toSelf().inSingletonScope();
  bind(CommandContribution)
    .to(VesRunCommandContribution)
    .inSingletonScope();
}
