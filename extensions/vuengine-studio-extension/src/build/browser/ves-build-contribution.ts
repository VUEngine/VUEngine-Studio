import { ApplicationShell, KeybindingContribution, KeybindingRegistry, PreferenceScope, PreferenceService } from '@theia/core/lib/browser';
import { CommandContribution, CommandRegistry, MAIN_MENU_BAR, MenuContribution, MenuModelRegistry } from '@theia/core/lib/common';
import { inject, injectable } from '@theia/core/shared/inversify';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesBuildCommands } from './ves-build-commands';
import { VesBuildPreferenceIds } from './ves-build-preferences';
import { VesBuildService } from './ves-build-service';
import { BuildMode } from './ves-build-types';
import { VesBuildViewContribution } from './ves-build-view-contribution';

export const buildMenuPath = [...MAIN_MENU_BAR, 'vesBuild'];
export namespace VesBuildMenuSection {
  export const ACTION = [...MAIN_MENU_BAR, 'vesBuild', '1_action'];
  export const CONFIG = [...MAIN_MENU_BAR, 'vesBuild', '2_config'];
  export const BUILD_OPTION = [...MAIN_MENU_BAR, 'vesBuild', '3_build_option'];
}

@injectable()
export class VesBuildContribution implements CommandContribution, KeybindingContribution, MenuContribution {
  @inject(ApplicationShell)
  protected readonly shell: ApplicationShell;
  @inject(PreferenceService)
  private readonly preferenceService: PreferenceService;
  @inject(VesBuildService)
  private readonly vesBuildService: VesBuildService;
  @inject(VesBuildViewContribution)
  private readonly VesBuildView: VesBuildViewContribution;
  @inject(WorkspaceService)
  private readonly workspaceService: WorkspaceService;

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(VesBuildCommands.CLEAN, {
      isVisible: () => this.workspaceService.opened,
      execute: () => this.vesBuildService.doClean(),
    });
    commandRegistry.registerCommand(VesBuildCommands.BUILD, {
      isVisible: () => this.workspaceService.opened,
      execute: (force: boolean = false) => this.vesBuildService.doBuild(force),
    });

    commandRegistry.registerCommand(VesBuildCommands.SET_MODE, {
      execute: async (buildMode?: BuildMode) => {
        if (buildMode) {
          await this.vesBuildService.setBuildMode(buildMode);
        } else {
          await this.vesBuildService.buildModeQuickPick();
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
  }
}
