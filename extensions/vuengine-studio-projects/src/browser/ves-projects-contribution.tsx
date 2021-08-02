import { inject, injectable } from '@theia/core/shared/inversify';
import { CommandContribution, CommandRegistry } from '@theia/core/lib/common/command';

import { VesProjectsCommands } from './ves-projects-commands';
import { VesNewProjectDialog } from './new-project/ves-projects-new-project-dialog';

@injectable()
export class VesProjectsContribution implements CommandContribution {
    @inject(VesNewProjectDialog)
    private readonly vesNewProjectDialog: VesNewProjectDialog;

    registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.registerCommand(VesProjectsCommands.NEW, {
            execute: () => !this.vesNewProjectDialog.isVisible && this.vesNewProjectDialog.open()
        });
    }
}
