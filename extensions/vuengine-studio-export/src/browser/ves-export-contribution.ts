import { inject, injectable } from '@theia/core/shared/inversify';
import { ApplicationShell, KeybindingContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry } from '@theia/core/lib/common';
import { WorkspaceService } from '@theia/workspace/lib/browser';

import { VesExportCommands } from './ves-export-commands';
import { VesExportService } from './ves-export-service';

@injectable()
export class VesExportContribution implements CommandContribution, KeybindingContribution, MenuContribution {
  constructor(
    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell,
    @inject(VesExportService)
    private readonly vesExportService: VesExportService,
    @inject(WorkspaceService)
    private readonly workspaceService: WorkspaceService,
  ) { }

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(VesExportCommands.EXPORT, {
      isVisible: () => this.workspaceService.opened,
      execute: async () => this.vesExportService.doExport(),
    });
  }

  registerKeybindings(registry: KeybindingRegistry): void {
    registry.registerKeybindings({
      command: VesExportCommands.EXPORT.id,
      keybinding: 'alt+shift+e'
    });
  }

  registerMenus(menus: MenuModelRegistry): void {
    /*
    menus.registerMenuAction(VesBuildMenuSection.ACTION, {
      commandId: VesExportCommands.EXPORT.id,
      label: VesExportCommands.EXPORT.label,
      order: '5'
    });
    */
  }
}
