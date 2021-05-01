import { inject, injectable, interfaces } from "inversify";
import {
  CommandContribution,
  CommandRegistry,
  isWindows,
} from "@theia/core/lib/common";
import { PreferenceService } from "@theia/core/lib/browser";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { VesBuildBuildCommand } from "./commands/build";
import { VesBuildSetModeCommand } from "./commands/set-mode";
import { VesBuildCleanCommand } from "./commands/clean";
import { VesBuildExportCommand } from "./commands/export";
import { VesBuildOpenWidgetCommand } from "./commands/show-build-widget";
import { VesBuildToggleDumpElfCommand } from "./commands/toggle-dump-elf";
import { VesBuildTogglePedanticWarningsCommand } from "./commands/toggle-pedantic-warnings";
import { VesBuildToggleEnableWslCommand } from "./commands/toggle-enable-wsl";
import { VesBuildCommands } from "./build-commands";
import { VesBuildPrefs } from "./build-preferences";
import { BuildMode } from "./build-types";

@injectable()
export class VesBuildCommandContribution implements CommandContribution {
  constructor(
    @inject(VesBuildBuildCommand) private readonly buildCommand: VesBuildBuildCommand,
    @inject(VesBuildCleanCommand) private readonly cleanCommand: VesBuildCleanCommand,
    @inject(VesBuildExportCommand) private readonly exportCommand: VesBuildExportCommand,
    @inject(VesBuildOpenWidgetCommand) private readonly openWidgetCommand: VesBuildOpenWidgetCommand,
    @inject(VesBuildSetModeCommand) private readonly setModeCommand: VesBuildSetModeCommand,
    @inject(VesBuildToggleDumpElfCommand) private readonly toggleDumpElfCommand: VesBuildToggleDumpElfCommand,
    @inject(VesBuildTogglePedanticWarningsCommand) private readonly togglePedanticWarningsCommand: VesBuildTogglePedanticWarningsCommand,
    @inject(VesBuildToggleEnableWslCommand) private readonly toggleEnableWslCommand: VesBuildToggleEnableWslCommand,
    @inject(PreferenceService) private readonly preferenceService: PreferenceService,
    @inject(WorkspaceService) private readonly workspaceService: WorkspaceService,
  ) { }

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(VesBuildCommands.CLEAN, {
      isVisible: () => this.workspaceService.opened,
      execute: async () => await this.cleanCommand.execute(),
    });
    commandRegistry.registerCommand(VesBuildCommands.BUILD, {
      isVisible: () => this.workspaceService.opened,
      execute: () => this.buildCommand.execute(),
    });
    commandRegistry.registerCommand(VesBuildCommands.EXPORT, {
      isVisible: () => this.workspaceService.opened,
      execute: async () => await this.exportCommand.execute(),
    });

    commandRegistry.registerCommand(VesBuildCommands.SET_MODE, {
      execute: (buildMode?: BuildMode) => this.setModeCommand.execute(buildMode)
    });

    commandRegistry.registerCommand(VesBuildCommands.TOGGLE_DUMP_ELF, {
      execute: () => this.toggleDumpElfCommand.execute(),
      isToggled: () => !!this.preferenceService.get(VesBuildPrefs.DUMP_ELF.id),
    });

    commandRegistry.registerCommand(VesBuildCommands.TOGGLE_PEDANTIC_WARNINGS, {
      execute: () => this.togglePedanticWarningsCommand.execute(),
      isToggled: () => !!this.preferenceService.get(VesBuildPrefs.PEDANTIC_WARNINGS.id),
    });

    if (isWindows) {
      commandRegistry.registerCommand(VesBuildCommands.TOGGLE_ENABLE_WSL, {
        execute: () => this.toggleEnableWslCommand.execute(),
        isToggled: () => !!this.preferenceService.get(VesBuildPrefs.ENABLE_WSL.id),
      });
    }

    commandRegistry.registerCommand(VesBuildCommands.OPEN_WIDGET, {
      execute: (forceOpen: boolean = false) => this.openWidgetCommand.execute(forceOpen),
    });
  }
}

export function bindVesBuildCommands(bind: interfaces.Bind): void {
  bind(VesBuildBuildCommand).toSelf().inSingletonScope();
  bind(VesBuildCleanCommand).toSelf().inSingletonScope();
  bind(VesBuildExportCommand).toSelf().inSingletonScope();
  bind(VesBuildOpenWidgetCommand).toSelf().inSingletonScope();
  bind(VesBuildSetModeCommand).toSelf().inSingletonScope();
  bind(VesBuildToggleDumpElfCommand).toSelf().inSingletonScope();
  bind(VesBuildTogglePedanticWarningsCommand).toSelf().inSingletonScope();
  bind(VesBuildToggleEnableWslCommand).toSelf().inSingletonScope();
  bind(CommandContribution).to(VesBuildCommandContribution).inSingletonScope();
}
