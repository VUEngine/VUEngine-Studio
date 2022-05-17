import { inject, injectable } from '@theia/core/shared/inversify';
import { CommandContribution, CommandRegistry } from '@theia/core/lib/common/command';
import { VesProjectCommands } from './ves-project-commands';
import { VesNewProjectDialog } from './new-project/ves-new-project-dialog';

@injectable()
export class VesProjectContribution implements CommandContribution {
    @inject(VesNewProjectDialog)
    private readonly vesNewProjectDialog: VesNewProjectDialog;

    registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.registerCommand(VesProjectCommands.NEW, {
            execute: () => !this.vesNewProjectDialog.isVisible && this.vesNewProjectDialog.open()
        });
    }
}
