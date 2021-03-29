import { inject, injectable, interfaces } from "inversify";
import { CommandContribution, CommandRegistry, CommandService } from "@theia/core/lib/common";
import { OpenerService, PreferenceService } from "@theia/core/lib/browser";
import { QuickPickService } from "@theia/core/lib/common/quick-pick-service";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { VesStateModel } from "../common/vesStateModel";
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
} from "./commands";
import { VesProcessService } from "../../common/process-service-protocol";
import { runInEmulatorCommand } from "./commands/runInEmulator";
import { selectEmulatorCommand } from "./commands/selectEmulator";
import { emulatorInput } from "./commands/emulatorInput";

@injectable()
export class VesRunCommandContribution implements CommandContribution {
  constructor(
    @inject(CommandService) private readonly commandService: CommandService,
    @inject(OpenerService) private readonly openerService: OpenerService,
    @inject(PreferenceService) private readonly preferenceService: PreferenceService,
    @inject(QuickPickService) private readonly quickPickService: QuickPickService,
    @inject(VesProcessService) private readonly vesProcessService: VesProcessService,
    @inject(VesStateModel) private readonly vesState: VesStateModel,
    @inject(WorkspaceService) private readonly workspaceService: WorkspaceService,
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
          this.vesState,
        ),
    });
    commandRegistry.registerCommand(VesSelectEmulatorCommand, {
      execute: () =>
        selectEmulatorCommand(
          this.preferenceService,
          this.quickPickService,
        ),
    });

    commandRegistry.registerCommand(VesEmulatorInputLUpCommand, {
      execute: () => emulatorInput("LUp"),
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputLRightCommand, {
      execute: () => emulatorInput("LRight"),
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputLDownCommand, {
      execute: () => emulatorInput("LDown"),
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputLLeftCommand, {
      execute: () => emulatorInput("LLeft"),
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputStartCommand, {
      execute: () => emulatorInput("Start"),
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputSelectCommand, {
      execute: () => emulatorInput("Select"),
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputLTriggerCommand, {
      execute: () => emulatorInput("LTrigger"),
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputRUpCommand, {
      execute: () => emulatorInput("RUp"),
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputRRightCommand, {
      execute: () => emulatorInput("RRight"),
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputRDownCommand, {
      execute: () => emulatorInput("RDown"),
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputRLeftCommand, {
      execute: () => emulatorInput("RLeft"),
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputBCommand, {
      execute: () => emulatorInput("B"),
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputACommand, {
      execute: () => emulatorInput("A"),
      isVisible: () => false,
    });
    commandRegistry.registerCommand(VesEmulatorInputRTriggerCommand, {
      execute: () => emulatorInput("RTrigger"),
      isVisible: () => false,
    });
  }
}

export function bindVesRunCommands(bind: interfaces.Bind): void {
  bind(CommandContribution).to(VesRunCommandContribution).inSingletonScope();
}