import { nls, Path } from '@theia/core';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileStat } from '@theia/filesystem/lib/common/files';
import { QuickOpenWorkspace } from '@theia/workspace/lib/browser/quick-open-workspace';
import { UntitledWorkspaceService } from '@theia/workspace/lib/common';
import { VesProjectService } from '../../project/browser/ves-project-service';

@injectable()
export class VesQuickOpenWorkspace extends QuickOpenWorkspace {
    @inject(UntitledWorkspaceService)
    protected readonly untitledWorkspaceService: UntitledWorkspaceService;
    @inject(VesProjectService)
    protected readonly vesProjectsService: VesProjectService;

    // TODO: had to override the entire function to change few lines (marked below),
    // ensure to keep this up to date with Theia
    async open(workspaces: string[]): Promise<void> {
        this.items = [];
        const [homeDirUri] = await Promise.all([
            this.envServer.getHomeDirUri(),
            this.workspaceService.getUntitledWorkspace()
        ]);
        const home = new URI(homeDirUri).path.fsPath();
        await this.preferences.ready;
        // Removed lines
        for (const workspace of workspaces) {
            const uri = new URI(workspace);
            let stat: FileStat | undefined;
            try {
                stat = await this.fileService.resolve(uri);
            } catch { }
            if (this.untitledWorkspaceService.isUntitledWorkspace(uri) || !stat) {
                continue; // skip the temporary workspace files or an undefined stat.
            }
            const icon =
                (uri.path.ext === '.workspace') ? 'codicon codicon-folder-library medium-purple' : // Added line
                    this.labelProvider.getIcon(stat);
            const iconClasses = icon === '' ? undefined : [icon + ' ves-codicon-file-icon file-icon']; // Modified line

            this.items.push({
                label: await this.vesProjectsService.getProjectName(uri), // Modified line
                description: Path.tildify(uri.path.fsPath(), home), // Modified line
                iconClasses,
                buttons: [this.removeRecentWorkspaceButton],
                resource: uri,
                execute: () => {
                    const current = this.workspaceService.workspace;
                    const uriToOpen = new URI(workspace);
                    if ((current && current.resource.toString() !== workspace) || !current) {
                        this.workspaceService.open(uriToOpen);
                    }
                },
            });
        }
        this.quickInputService?.showQuickPick(this.items, {
            placeholder: nls.localize(
                'theia/workspace/openRecentPlaceholder',
                'Type the name of the workspace you want to open'),
            onDidTriggerItemButton: async context => {
                const resource = (context.item).resource;
                if (resource) {
                    await this.workspaceService.removeRecentWorkspace(resource.toString());
                    context.removeItem();
                }
            }
        });
    }
}
