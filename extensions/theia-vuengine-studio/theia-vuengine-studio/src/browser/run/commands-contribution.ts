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
import {
  VesRunCommand,
  VesSelectEmulatorCommand,
  VesEmulatorInputLUpCommand,
  VesEmulatorInputLRightCommand,
  VesEmulatorInputLDownCommand,
  VesEmulatorInputLLeftCommand,
  VesEmulatorInputStartCommand,
  VesEmulatorInputSelectCommand,
  VesEmulatorInputLTriggerCommand,
  VesEmulatorInputRUpCommand,
  VesEmulatorInputRRightCommand,
  VesEmulatorInputRDownCommand,
  VesEmulatorInputRLeftCommand,
  VesEmulatorInputBCommand,
  VesEmulatorInputACommand,
  VesEmulatorInputRTriggerCommand,
  VesEmulatorInputSaveStateCommand,
  VesEmulatorInputLoadStateCommand,
  VesEmulatorInputStateSlotDecreaseCommand,
  VesEmulatorInputStateSlotIncreaseCommand,
  VesEmulatorInputToggleFastForwardCommand,
  VesEmulatorInputPauseToggleCommand,
  VesEmulatorInputToggleSlowmotionCommand,
  VesEmulatorInputRewindCommand,
  VesEmulatorInputFrameAdvanceCommand,
  VesEmulatorInputResetCommand,
  VesEmulatorInputAudioMuteCommand,
} from "./commands";
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
    commandRegistry.registerCommand(VesRunCommand, {
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
    commandRegistry.registerCommand(VesSelectEmulatorCommand, {
      execute: () =>
        selectEmulatorCommand(this.preferenceService, this.quickPickService),
    });

    commandRegistry.registerCommand(VesEmulatorInputLUpCommand, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputLRightCommand, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputLDownCommand, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputLLeftCommand, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputStartCommand, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputSelectCommand, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputLTriggerCommand, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputRUpCommand, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputRRightCommand, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputRDownCommand, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputRLeftCommand, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputBCommand, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputACommand, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputRTriggerCommand, {
      execute: () => { },
      isVisible: () => false,
    });

    commandRegistry.registerCommand(VesEmulatorInputSaveStateCommand, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputLoadStateCommand, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputStateSlotDecreaseCommand, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputStateSlotIncreaseCommand, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputToggleFastForwardCommand, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputPauseToggleCommand, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputToggleSlowmotionCommand, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputRewindCommand, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputFrameAdvanceCommand, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputResetCommand, {
      execute: () => { },
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputAudioMuteCommand, {
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
