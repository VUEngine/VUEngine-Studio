import { inject, injectable } from '@theia/core/shared/inversify';
import { ApplicationShell, KeybindingContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { CommandContribution, CommandRegistry } from '@theia/core/lib/common';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesImagesCommands } from './ves-images-commands';
import { VesImagesService } from './ves-images-service';

@injectable()
export class VesImagesContribution implements CommandContribution, KeybindingContribution {
  @inject(ApplicationShell)
  protected readonly shell: ApplicationShell;
  @inject(VesImagesService)
  private readonly VesImagesService: VesImagesService;
  @inject(WorkspaceService)
  private readonly workspaceService: WorkspaceService;

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(VesImagesCommands.CONVERT_ALL, {
      isVisible: () => this.workspaceService.opened,
      isEnabled: () => !this.VesImagesService.isConverting,
      execute: async () => this.VesImagesService.convertAll(false),
    });
    commandRegistry.registerCommand(VesImagesCommands.CONVERT_CHANGED, {
      isVisible: () => this.workspaceService.opened,
      isEnabled: () => !this.VesImagesService.isConverting,
      execute: async () => this.VesImagesService.convertAll(true),
    });
  }

  registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybindings({
      command: VesImagesCommands.CONVERT_CHANGED.id,
      keybinding: 'alt+shift+v'
    });
  }
}
