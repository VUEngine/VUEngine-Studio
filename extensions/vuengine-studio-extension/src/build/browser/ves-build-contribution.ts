import { join as joinPath } from 'path';
import * as rimraf from 'rimraf';
import { inject, injectable } from '@theia/core/shared/inversify';
import { CommandContribution, CommandRegistry, isWindows, MAIN_MENU_BAR, MenuContribution, MenuModelRegistry, MessageService } from '@theia/core/lib/common';
import { ApplicationShell, KeybindingContribution, KeybindingRegistry, PreferenceScope, PreferenceService, QuickPickItem, QuickPickOptions } from '@theia/core/lib/browser';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { QuickPickService } from '@theia/core/lib/common/quick-pick-service';
import { VesBuildCommands } from './ves-build-commands';
import { VesBuildViewContribution } from './ves-build-view';
import { VesBuildPreferenceIds } from './ves-build-preferences';
import { VesBuildService } from './ves-build-service';
import { BuildMode } from './ves-build-types';

export const buildMenuPath = [...MAIN_MENU_BAR, 'vesBuild'];
export namespace VesBuildMenuSection {
  export const ACTION = [...MAIN_MENU_BAR, 'vesBuild', '1_action'];
  export const CONFIG = [...MAIN_MENU_BAR, 'vesBuild', '2_config'];
  export const BUILD_OPTION = [...MAIN_MENU_BAR, 'vesBuild', '3_build_option'];
}

@injectable()
export class VesBuildContribution implements CommandContribution, KeybindingContribution, MenuContribution {
  constructor(
    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell,
    @inject(MessageService)
    protected readonly messageService: MessageService,
    @inject(PreferenceService)
    private readonly preferenceService: PreferenceService,
    @inject(QuickPickService)
    protected readonly quickPickService: QuickPickService,
    @inject(VesBuildService)
    private readonly vesBuildService: VesBuildService,
    @inject(VesBuildViewContribution)
    private readonly VesBuildView: VesBuildViewContribution,
    @inject(WorkspaceService)
    private readonly workspaceService: WorkspaceService,
  ) { }

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(VesBuildCommands.CLEAN, {
      isVisible: () => this.workspaceService.opened,
      execute: async () => {
        if (this.vesBuildService.isCleaning) {
          return;
        }

        const buildMode = this.preferenceService.get(VesBuildPreferenceIds.BUILD_MODE) as BuildMode;

        if (this.vesBuildService.buildFolderExists[buildMode]) {
          this.clean(buildMode);
        } else {
          // messageService.info(`Build folder for ${buildMode} mode does not exist. Nothing to clean.`);
        }
      },
    });
    commandRegistry.registerCommand(VesBuildCommands.BUILD, {
      isVisible: () => this.workspaceService.opened,
      execute: () => this.vesBuildService.doBuild(),
    });

    commandRegistry.registerCommand(VesBuildCommands.SET_MODE, {
      execute: (buildMode?: BuildMode) => {
        if (buildMode) {
          this.setBuildMode(buildMode);
        } else {
          this.buildModeQuickPick();
        }
      }
    });

    commandRegistry.registerCommand(VesBuildCommands.TOGGLE_DUMP_ELF, {
      execute: () => {
        const current = this.preferenceService.get(VesBuildPreferenceIds.DUMP_ELF);
        this.preferenceService.set(VesBuildPreferenceIds.DUMP_ELF, !current, PreferenceScope.User);
      },
      isToggled: () => !!this.preferenceService.get(VesBuildPreferenceIds.DUMP_ELF),
    });

    commandRegistry.registerCommand(VesBuildCommands.TOGGLE_PEDANTIC_WARNINGS, {
      execute: () => {
        const current = this.preferenceService.get(VesBuildPreferenceIds.PEDANTIC_WARNINGS);
        this.preferenceService.set(VesBuildPreferenceIds.PEDANTIC_WARNINGS, !current, PreferenceScope.User);
      },
      isToggled: () => !!this.preferenceService.get(VesBuildPreferenceIds.PEDANTIC_WARNINGS),
    });

    if (isWindows) {
      commandRegistry.registerCommand(VesBuildCommands.TOGGLE_ENABLE_WSL, {
        execute: () => {
          const current = this.preferenceService.get(VesBuildPreferenceIds.ENABLE_WSL);
          this.preferenceService.set(VesBuildPreferenceIds.ENABLE_WSL, !current, PreferenceScope.User);
        },
        isToggled: () => !!this.preferenceService.get(VesBuildPreferenceIds.ENABLE_WSL),
      });
    }

    commandRegistry.registerCommand(VesBuildCommands.TOGGLE_WIDGET, {
      execute: (forceOpen: boolean = false) => {
        if (forceOpen) {
          this.VesBuildView.openView({ activate: true, reveal: true });
        } else {
          this.VesBuildView.toggleView();
        }
      },
    });
  }

  registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybindings({
      command: VesBuildCommands.BUILD.id,
      keybinding: 'f5'
    }, {
      command: VesBuildCommands.BUILD.id,
      keybinding: 'alt+shift+b'
    }, {
      command: VesBuildCommands.CLEAN.id,
      keybinding: 'alt+shift+c'
    });
  }

  registerMenus(menus: MenuModelRegistry): void {
    /*
    menus.registerSubmenu(buildMenuPath, 'Build', {
      order: '6'
    });

    menus.registerMenuAction(VesBuildMenuSection.ACTION, {
      commandId: VesBuildCommands.CLEAN.id,
      label: VesBuildCommands.CLEAN.label,
      order: '1'
    });
    menus.registerMenuAction(VesBuildMenuSection.ACTION, {
      commandId: VesBuildCommands.BUILD.id,
      label: VesBuildCommands.BUILD.label,
      order: '2'
    });

    menus.registerMenuAction(VesBuildMenuSection.CONFIG, {
      commandId: VesBuildCommands.SET_MODE.id,
      label: VesBuildCommands.SET_MODE.label,
      order: '1'
    });

    menus.registerMenuAction(VesBuildMenuSection.BUILD_OPTION, {
      commandId: VesBuildCommands.TOGGLE_DUMP_ELF.id,
      label: 'Dump ELF',
      order: '1'
    });
    menus.registerMenuAction(VesBuildMenuSection.BUILD_OPTION, {
      commandId: VesBuildCommands.TOGGLE_PEDANTIC_WARNINGS.id,
      label: 'Pedantic Warnings',
      order: '2'
    });
    /*if (isWindows) {
      menus.registerMenuAction(VesBuildMenuSection.OPTION, {
        commandId: VesBuildCommands.TOGGLE_ENABLE_WSL.id,
        label: 'Enable WSL',
        order: '3'
      });
    }*/
  }

  async buildModeQuickPick(buildMode?: BuildMode): Promise<void> {
    const currentBuildMode = this.preferenceService.get(VesBuildPreferenceIds.BUILD_MODE) as BuildMode;

    const quickPickOptions: QuickPickOptions<QuickPickItem> = {
      title: 'Set Build Mode',
      placeholder: 'Select which mode to build in'
    };

    const buildTypes = [
      {
        label: BuildMode.Release,
        value: BuildMode.Release,
        detail: 'Includes no asserts or debug flags, for shipping only.',
        iconClass: (BuildMode.Release === currentBuildMode) ? 'fa fa-check' : '',
      },
      {
        label: BuildMode.Beta,
        value: BuildMode.Beta,
        detail: 'Includes selected asserts, for testing the performance on hardware.',
        iconClass: (BuildMode.Beta === currentBuildMode) ? 'fa fa-check' : '',
      },
      {
        label: BuildMode.Tools,
        value: BuildMode.Tools,
        detail: 'Includes selected asserts, includes debugging tools.',
        iconClass: (BuildMode.Tools === currentBuildMode) ? 'fa fa-check' : '',
      },
      {
        label: BuildMode.Debug,
        value: BuildMode.Debug,
        detail: 'Includes all runtime assertions, includes debugging tools.',
        iconClass: (BuildMode.Debug === currentBuildMode) ? 'fa fa-check' : '',
      },
      {
        label: BuildMode.Preprocessor,
        value: BuildMode.Preprocessor,
        detail: 'The .o files are preprocessor output instead of compiler output.',
        iconClass: (BuildMode.Preprocessor === currentBuildMode) ? 'fa fa-check' : '',
      }
    ];

    this.quickPickService.show<QuickPickItem>(buildTypes, quickPickOptions).then(selection => {
      if (!selection) {
        return;
      }
      this.setBuildMode(selection.label);
    });
  }

  protected setBuildMode(buildMode: string): void {
    this.preferenceService.set(VesBuildPreferenceIds.BUILD_MODE, buildMode, PreferenceScope.User);
  }

  protected async clean(buildMode: BuildMode): Promise<void> {
    const cleanPath = this.getCleanPath(buildMode);

    if (!this.vesBuildService.buildFolderExists[buildMode]) {
      // messageService.info(`Build folder for ${buildMode} mode does not exist.`);
      return;
    }

    const progressMessage = await this.messageService.showProgress({
      text: `Cleaning build folder for ${buildMode} Mode...`,
    });

    this.vesBuildService.isCleaning = true;
    const vesBuildService = this.vesBuildService;
    const buildFolder = this.vesBuildService.getBuildPath();
    rimraf(cleanPath, function (): void {
      rimraf(joinPath(buildFolder, '*.*'), function (): void {
        progressMessage.cancel();
        vesBuildService.isCleaning = false;
        vesBuildService.setBuildFolderExists(buildMode, false);
        // messageService.info(`Build folder for ${buildMode} mode has been cleaned.`);
      });
    });
  }

  protected getCleanPath(buildMode: BuildMode): string {
    return joinPath(this.vesBuildService.getBuildPath(), buildMode);
  }
}
