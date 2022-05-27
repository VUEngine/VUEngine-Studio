import { ApplicationShell } from '@theia/core/lib/browser';
import { CommandContribution, CommandRegistry } from '@theia/core/lib/common';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesRumblePackCommands } from './ves-rumble-pack-commands';
import { VesRumblePackService } from './ves-rumble-pack-service';

@injectable()
export class VesRumblePackContribution implements CommandContribution {
  @inject(ApplicationShell)
  protected readonly shell: ApplicationShell;
  @inject(VesRumblePackService)
  private readonly vesRumblePackService: VesRumblePackService;

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(VesRumblePackCommands.DETECT, {
      execute: () => this.vesRumblePackService.detectRumblePackIsConnected(),
    });
  }
}
