import { CommandContribution, CommandRegistry } from '@theia/core/lib/common/command';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesNewProjectDialog } from './new-project/ves-new-project-dialog';
import { VesProjectCommands } from './ves-project-commands';
import { VesProjectService } from './ves-project-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';

@injectable()
export class VesProjectContribution implements CommandContribution {
    @inject(VesNewProjectDialog)
    private readonly vesNewProjectDialog: VesNewProjectDialog;
    @inject(VesProjectService)
    private readonly vesProjectService: VesProjectService;
    @inject(WorkspaceService)
    private readonly workspaceService: WorkspaceService;

    async registerCommands(commandRegistry: CommandRegistry): Promise<void> {

        commandRegistry.registerCommand(VesProjectCommands.NEW, {
            execute: () => !this.vesNewProjectDialog.isVisible && this.vesNewProjectDialog.open()
        });
        commandRegistry.registerCommand(VesProjectCommands.UPDATE_FILES, {
            isVisible: () => this.workspaceService.opened,
            execute: () => this.vesProjectService.updateFiles(),
        });

        /*
        await this.workspaceService.ready;
        commandRegistry.registerCommand(VesProjectCommands.EDIT_NAME, {
            isEnabled: () => this.workspaceService.opened,
            isVisible: widget => widget?.id === EXPLORER_VIEW_CONTAINER_ID,
            execute: async () => {
                await this.vesProjectService.projectDataReady;
                const initialValue = await this.vesProjectService.getProjectName();
                const dialog = new SingleTextInputDialog({
                    title: nls.localize('vuengine/projects/commands/editName', 'Edit Project Name'),
                    maxWidth: 400,
                    initialValue,
                });
                dialog.open().then(async name => {
                    if (name) {
                        await this.vesProjectService.setProjectName(name);
                    }
                });
            }
        });
        */
    }
}
