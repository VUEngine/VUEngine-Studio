import { CommandContribution, CommandRegistry, CommandService } from '@theia/core/lib/common';
import { inject, injectable } from '@theia/core/shared/inversify';
import { OutputCommands } from '@theia/output/lib/browser/output-commands';
import { VesWorkspaceService } from '../../core/browser/ves-workspace-service';
import { VesCodeGenCommands } from './ves-codegen-commands';
import { VesCodeGenService } from './ves-codegen-service';
import { CODEGEN_CHANNEL_NAME } from './ves-codegen-types';

@injectable()
export class VesCodeGenContribution implements CommandContribution {
  @inject(CommandService)
  private readonly commandService: CommandService;
  @inject(VesCodeGenService)
  private readonly vesCodeGenService: VesCodeGenService;
  @inject(VesWorkspaceService)
  protected readonly workspaceService: VesWorkspaceService;

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(VesCodeGenCommands.GENERATE_FILES, {
      isEnabled: () => this.workspaceService.opened,
      isVisible: () => this.workspaceService.opened,
      execute: () => this.vesCodeGenService.promptGenerateAll(),
    });
    commandRegistry.registerCommand(VesCodeGenCommands.GENERATE_ALL_CHANGED, {
      isEnabled: () => this.workspaceService.opened,
      isVisible: () => false,
      execute: () => this.vesCodeGenService.generateAllChanged(),
    });
    commandRegistry.registerCommand(VesCodeGenCommands.SHOW_OUTPUT_CHANNEL, {
      isEnabled: () => this.workspaceService.opened,
      isVisible: () => this.workspaceService.opened,
      execute: () => this.commandService.executeCommand(OutputCommands.SHOW.id, { name: CODEGEN_CHANNEL_NAME }),
    });
  }
}
