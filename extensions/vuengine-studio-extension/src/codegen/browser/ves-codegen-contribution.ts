import { inject, injectable } from '@theia/core/shared/inversify';
import { CommandContribution, CommandRegistry } from '@theia/core/lib/common';
import { VesCodeGenCommands } from './ves-codegen-commands';
import { VesCodeGenService } from './ves-codegen-service';

@injectable()
export class VesCodeGenContribution implements CommandContribution {
  constructor(
    @inject(VesCodeGenService)
    private readonly vesCodeGenService: VesCodeGenService,
  ) { }

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(VesCodeGenCommands.GENERATE_ALL, {
      execute: () => this.vesCodeGenService.generateAll(),
    });
  }
}
