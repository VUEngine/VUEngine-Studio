import { inject, injectable, interfaces } from "inversify";
import {
  CommandContribution,
  CommandRegistry,
  CommandService,
} from "@theia/core/lib/common";
import {
  ApplicationShell,
  OpenerService,
  PreferenceService,
} from "@theia/core/lib/browser";
import { QuickPickService } from "@theia/core/lib/common/quick-pick-service";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { VesState } from "../common/ves-state";
import { VesEmulatorCommands } from "./emulator-commands";
import { VesProcessService } from "../../common/process-service-protocol";
import { runInEmulatorCommand } from "./commands/runInEmulator";
import { selectEmulatorCommand } from "./commands/selectEmulator";

@injectable()
export class VesRunCommandContribution implements CommandContribution {
  constructor(
    @inject(CommandService) private readonly commandService: CommandService,
    @inject(OpenerService) private readonly openerService: OpenerService,
    @inject(PreferenceService)
    private readonly preferenceService: PreferenceService,
    @inject(QuickPickService)
    private readonly quickPickService: QuickPickService,
    @inject(ApplicationShell) protected readonly shell: ApplicationShell,
    @inject(VesProcessService)
    private readonly vesProcessService: VesProcessService,
    @inject(VesState) private readonly vesState: VesState,
    @inject(WorkspaceService)
    private readonly workspaceService: WorkspaceService
  ) { }

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(VesEmulatorCommands.RUN, {
      isVisible: () => this.workspaceService.opened,
      execute: () =>
        runInEmulatorCommand(
          this.commandService,
          this.openerService,
          this.preferenceService,
          this.vesProcessService,
          this.vesState
        ),
    });
    commandRegistry.registerCommand(VesEmulatorCommands.SELECT, {
      execute: () =>
        selectEmulatorCommand(this.preferenceService, this.quickPickService),
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
  bind(CommandContribution)
    .to(VesRunCommandContribution)
    .inSingletonScope();
}
