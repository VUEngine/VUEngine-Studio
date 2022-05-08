import { ApplicationShell } from '@theia/core/lib/browser';
import { CommandContribution, CommandRegistry } from '@theia/core/lib/common';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesRumblePackCommands } from './ves-rumble-pack-commands';
import { VesRumblePackService } from './ves-rumble-pack-service';
import { VesRumblePackViewContribution } from './ves-rumble-pack-view-contribution';

@injectable()
export class VesRumblePackContribution implements CommandContribution {
  @inject(ApplicationShell)
  protected readonly shell: ApplicationShell;
  @inject(VesRumblePackService)
  private readonly vesRumblePackService: VesRumblePackService;
  @inject(VesRumblePackViewContribution)
  private readonly vesRumblePackView: VesRumblePackViewContribution;

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(VesRumblePackCommands.OPEN_WIDGET, {
      execute: () => {
        this.vesRumblePackView.openView({ activate: true, reveal: true });
      }
    });

    commandRegistry.registerCommand(VesRumblePackCommands.DETECT, {
      execute: () => this.vesRumblePackService.detectRumblePackIsConnected(),
    });
  }
}
