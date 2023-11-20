import { inject, injectable } from '@theia/core/shared/inversify';
import { CommandContribution, CommandRegistry } from '@theia/core/lib/common/command';
import { VesProjectCommands } from './ves-project-commands';
import { VesNewProjectDialog } from './new-project/ves-new-project-dialog';
import { SingleTextInputDialog } from '@theia/core/lib/browser';
import { nls } from '@theia/core';
import { VesProjectService } from './ves-project-service';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { EXPLORER_VIEW_CONTAINER_ID } from '@theia/navigator/lib/browser/navigator-widget-factory';

@injectable()
export class VesProjectContribution implements CommandContribution, TabBarToolbarContribution {
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

        await this.workspaceService.ready;
        commandRegistry.registerCommand(VesProjectCommands.EDIT_NAME, {
            isEnabled: () => this.workspaceService.opened,
            isVisible: widget => widget.id === EXPLORER_VIEW_CONTAINER_ID,
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
    }

    async registerToolbarItems(toolbar: TabBarToolbarRegistry): Promise<void> {
        await this.workspaceService.ready;
        if (this.workspaceService.opened) {
            toolbar.registerItem({
                id: VesProjectCommands.EDIT_NAME.id,
                command: VesProjectCommands.EDIT_NAME.id,
                tooltip: VesProjectCommands.EDIT_NAME.label,
                priority: 0,
            });
        }
    }
}
