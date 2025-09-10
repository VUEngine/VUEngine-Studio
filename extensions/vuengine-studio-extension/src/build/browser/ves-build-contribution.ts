import { ApplicationShell, KeybindingContribution, KeybindingRegistry, PreferenceScope, PreferenceService } from '@theia/core/lib/browser';
import { CommandContribution, CommandRegistry, MAIN_MENU_BAR, MenuContribution, MenuModelRegistry, nls } from '@theia/core/lib/common';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesWorkspaceService } from '../../core/browser/ves-workspace-service';
import { VesBuildCommands } from './ves-build-commands';
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
  @inject(ApplicationShell)
  protected readonly shell: ApplicationShell;
  @inject(PreferenceService)
  private readonly preferenceService: PreferenceService;
  @inject(VesBuildService)
  private readonly vesBuildService: VesBuildService;
  @inject(VesWorkspaceService)
  private readonly workspaceService: VesWorkspaceService;

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(VesBuildCommands.CLEAN, {
      isEnabled: () => !this.workspaceService.isCollaboration(),
      isVisible: () => this.workspaceService.opened,
      execute: () => this.vesBuildService.doClean(),
    });
    commandRegistry.registerCommand(VesBuildCommands.BUILD, {
      isEnabled: () => !this.workspaceService.isCollaboration(),
      isVisible: () => this.workspaceService.opened,
      execute: (force: boolean = false) => this.vesBuildService.doBuild(force),
    });

    commandRegistry.registerCommand(VesBuildCommands.SET_MODE, {
      isEnabled: () => !this.workspaceService.isCollaboration(),
      isVisible: () => this.workspaceService.opened,
      execute: async (buildMode?: BuildMode) => {
        if (buildMode) {
          await this.vesBuildService.setBuildMode(buildMode);
        } else {
          await this.vesBuildService.buildModeQuickPick();
        }
      },
    });

    commandRegistry.registerCommand(VesBuildCommands.TOGGLE_DUMP_ELF, {
      isEnabled: () => !this.workspaceService.isCollaboration(),
      isVisible: () => this.workspaceService.opened,
      isToggled: () => !!this.preferenceService.get(VesBuildPreferenceIds.DUMP_ELF),
      execute: () => {
        const current = this.preferenceService.get(VesBuildPreferenceIds.DUMP_ELF);
        this.preferenceService.set(VesBuildPreferenceIds.DUMP_ELF, !current, PreferenceScope.User);
      },
    });

    commandRegistry.registerCommand(VesBuildCommands.TOGGLE_PEDANTIC_WARNINGS, {
      isEnabled: () => !this.workspaceService.isCollaboration(),
      isVisible: () => this.workspaceService.opened,
      isToggled: () => !!this.preferenceService.get(VesBuildPreferenceIds.PEDANTIC_WARNINGS),
      execute: () => {
        const current = this.preferenceService.get(VesBuildPreferenceIds.PEDANTIC_WARNINGS);
        this.preferenceService.set(VesBuildPreferenceIds.PEDANTIC_WARNINGS, !current, PreferenceScope.User);
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
    menus.registerSubmenu(buildMenuPath, nls.localize('vuengine/build/build', 'Build'), {
      sortString: '6'
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
      label: nls.localize('vuengine/build/dumpElf', 'Dump ELF'),
      order: '1'
    });
    menus.registerMenuAction(VesBuildMenuSection.BUILD_OPTION, {
      commandId: VesBuildCommands.TOGGLE_PEDANTIC_WARNINGS.id,
      label: nls.localize('vuengine/build/pedanticWarnings', 'Pedantic Warnings'),
      order: '2'
    });
  }
}
