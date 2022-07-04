import { CommonMenus } from '@theia/core/lib/browser';
import { CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry } from '@theia/core/lib/common';
import { inject, injectable } from '@theia/core/shared/inversify';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesMigrateCommands } from './ves-migrate-commands';
import { VesMigrateService } from './ves-migrate-service';

@injectable()
export class VesMigrateContribution implements CommandContribution, MenuContribution {
  @inject(VesMigrateService)
  private readonly vesMigrateService: VesMigrateService;
  @inject(WorkspaceService)
  private readonly workspaceService: WorkspaceService;

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(VesMigrateCommands.MIGRATE, {
      isVisible: () => this.workspaceService.opened,
      execute: () => this.vesMigrateService.migrate(),
    });
  }
  registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(CommonMenus.HELP, {
      commandId: VesMigrateCommands.MIGRATE.id,
      label: VesMigrateCommands.MIGRATE.label,
      order: 'b10'
    });
  }
}
