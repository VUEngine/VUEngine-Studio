import { inject, injectable } from '@theia/core/shared/inversify';
import { ApplicationShell, KeybindingContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { CommandContribution, CommandRegistry } from '@theia/core/lib/common';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesImageConverterCommands } from './ves-image-converter-commands';
import { VesImageConverterService } from './ves-image-converter-service';

@injectable()
export class VesImageConverterContribution implements CommandContribution, KeybindingContribution {
  @inject(ApplicationShell)
  protected readonly shell: ApplicationShell;
  @inject(VesImageConverterService)
  private readonly vesImageConverterService: VesImageConverterService;
  @inject(WorkspaceService)
  private readonly workspaceService: WorkspaceService;

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(VesImageConverterCommands.CONVERT_ALL, {
      isVisible: () => this.workspaceService.opened,
      isEnabled: () => !this.vesImageConverterService.isConverting,
      execute: async () => this.vesImageConverterService.convertAll(false),
    });
    commandRegistry.registerCommand(VesImageConverterCommands.CONVERT_CHANGED, {
      isVisible: () => this.workspaceService.opened,
      isEnabled: () => !this.vesImageConverterService.isConverting,
      execute: async () => this.vesImageConverterService.convertAll(true),
    });
    /*/
    commandRegistry.registerCommand({
      id: 'VesImageConverter.commands.convertJsonFiles',
      label: 'TEMP: CONVERT IMAGE CONFIG FILES',
      category: VesImageConverterCommands.CATEGORY,
    }, {
      isVisible: () => this.workspaceService.opened,
      isEnabled: () => !this.vesImageConverterService.isConverting,
      execute: async () => this.vesImageConverterService.updateImageJsonFiles(),
    });
    /**/
  }

  registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybindings({
      command: VesImageConverterCommands.CONVERT_CHANGED.id,
      keybinding: 'alt+shift+v'
    });
  }
}
