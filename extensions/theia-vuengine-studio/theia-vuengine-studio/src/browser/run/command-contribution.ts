import { inject, injectable, interfaces } from "inversify";
import {
  CommandContribution,
  CommandRegistry,
  CommandService,
} from "@theia/core/lib/common";
import { runCommand } from "./commands/run";
import { selectEmulatorCommand } from "./commands/selectEmulator";
import { PreferenceService } from "@theia/core/lib/browser";
import { VesStateModel } from "../common/vesStateModel";
import { VesRunCommand, VesSelectEmulatorCommand } from "./commands";
import { QuickPickService } from "@theia/core/lib/common/quick-pick-service";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { VesProcessService } from "../../common/process-service-protocol";
import { VesProcessWatcher } from "../services/process-service/process-watcher";
import { VesEmulatorContribution } from "./widget/emulator-view";

@injectable()
export class VesRunCommandContribution implements CommandContribution {
  constructor(
    @inject(CommandService) private readonly commandService: CommandService,
    @inject(PreferenceService) private readonly preferenceService: PreferenceService,
    @inject(QuickPickService) private readonly quickPickService: QuickPickService,
    @inject(VesProcessService) private readonly vesProcessService: VesProcessService,
    @inject(VesStateModel) private readonly vesState: VesStateModel,
    @inject(VesProcessWatcher) private readonly vesProcessWatcher: VesProcessWatcher,
    @inject(WorkspaceService) private readonly workspaceService: WorkspaceService,
    @inject(VesEmulatorContribution) private readonly vesEmulator: VesEmulatorContribution,
  ) { }

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(VesRunCommand, {
      isVisible: () => this.workspaceService.opened,
      execute: () =>
        runCommand(
          this.commandService,
          this.preferenceService,
          this.vesEmulator,
          this.vesProcessService,
          this.vesProcessWatcher,
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