import { inject, injectable } from '@theia/core/shared/inversify';
import { CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry } from '@theia/core/lib/common';
import { ApplicationShell, KeybindingContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesFlashCartCommands } from './ves-flash-cart-commands';
import { VesFlashCartService } from './ves-flash-cart-service';
import { VesBuildMenuSection } from '../../build/browser/ves-build-contribution';

@injectable()
export class VesFlashCartContribution implements CommandContribution, KeybindingContribution, MenuContribution {
  @inject(ApplicationShell)
  protected readonly shell: ApplicationShell;
  @inject(VesFlashCartService)
  private readonly vesFlashCartService: VesFlashCartService;
  @inject(WorkspaceService)
  private readonly workspaceService: WorkspaceService;

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(VesFlashCartCommands.FLASH, {
      isVisible: () => this.workspaceService.opened,
      execute: () => this.vesFlashCartService.doFlash(),
    });

    commandRegistry.registerCommand(VesFlashCartCommands.DETECT, {
      execute: () => this.vesFlashCartService.detectConnectedFlashCarts(),
    });
  }

  registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybinding((
      {
        command: VesFlashCartCommands.FLASH.id,
        keybinding: 'alt+shift+f'
      }
    ));
  }

  registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(VesBuildMenuSection.ACTION, {
      commandId: VesFlashCartCommands.FLASH.id,
      label: VesFlashCartCommands.FLASH.label,
      order: '4'
    });
  }
}
