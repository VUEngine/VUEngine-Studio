import { CommandContribution, CommandRegistry, CommandService } from '@theia/core/lib/common';
import { inject, injectable } from '@theia/core/shared/inversify';
import { OutputCommands } from '@theia/output/lib/browser/output-commands';
import { VesCodeGenCommands } from './ves-codegen-commands';
import { VesCodeGenService } from './ves-codegen-service';
import { CODEGEN_CHANNEL_NAME } from './ves-codegen-types';

@injectable()
export class VesCodeGenContribution implements CommandContribution {
  @inject(CommandService)
  private readonly commandService: CommandService;
  @inject(VesCodeGenService)
  private readonly vesCodeGenService: VesCodeGenService;

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(VesCodeGenCommands.GENERATE_FILES, {
      execute: () => this.vesCodeGenService.generateAll(),
    });
    commandRegistry.registerCommand(VesCodeGenCommands.SHOW_OUTPUT_CHANNEL, {
      execute: () => this.commandService.executeCommand(OutputCommands.SHOW.id, { name: CODEGEN_CHANNEL_NAME }),
    });
  }
}
