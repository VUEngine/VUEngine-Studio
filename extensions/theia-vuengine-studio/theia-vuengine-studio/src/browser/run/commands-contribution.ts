import { inject, injectable, interfaces } from "inversify";
import { CommandContribution, CommandRegistry, CommandService } from "@theia/core/lib/common";
import { OpenerService, PreferenceService } from "@theia/core/lib/browser";
import { QuickPickService } from "@theia/core/lib/common/quick-pick-service";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { VesStateModel } from "../common/vesStateModel";
import { VesRunCommand, VesSelectEmulatorCommand } from "./commands";
import { VesProcessService } from "../../common/process-service-protocol";
import { runInEmulatorCommand } from "./commands/runInEmulator";
import { selectEmulatorCommand } from "./commands/selectEmulator";

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
  }
}

export function bindVesRunCommands(bind: interfaces.Bind): void {
  bind(CommandContribution).to(VesRunCommandContribution).inSingletonScope();
}