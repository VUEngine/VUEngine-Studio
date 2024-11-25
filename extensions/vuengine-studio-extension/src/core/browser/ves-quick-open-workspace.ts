import { nls, Path, QuickPickItem, QuickPickSeparator } from '@theia/core';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { QuickOpenWorkspace } from '@theia/workspace/lib/browser/quick-open-workspace';
import { UntitledWorkspaceService } from '@theia/workspace/lib/common';
import { VesProjectService } from '../../project/browser/ves-project-service';

interface RecentlyOpenedPick extends QuickPickItem {
    resource?: URI
}

@injectable()
export class VesQuickOpenWorkspace extends QuickOpenWorkspace {
    @inject(UntitledWorkspaceService)
    protected readonly untitledWorkspaceService: UntitledWorkspaceService;
    @inject(VesProjectService)
    protected readonly vesProjectsService: VesProjectService;

    // TODO: had to override the entire function to change few lines (marked below),
    // ensure to keep this up to date with Theia
    async open(workspaces: string[]): Promise<void> {
        const homeDirUri = await this.envServer.getHomeDirUri();
        const home = new URI(homeDirUri).path.fsPath();
        const items: (RecentlyOpenedPick | QuickPickSeparator)[] = [{
            type: 'separator',
            label: nls.localizeByDefault('folders & workspaces')
        }];

        for (const workspace of workspaces) {
            const uri = new URI(workspace);
            const label = await this.vesProjectsService.getProjectName(uri); // Modified line
            if (!label || this.untitledWorkspaceService.isUntitledWorkspace(uri)) {
                continue; // skip temporary workspace files & empty workspace names
            }
            items.push({
                label: label,
                description: Path.tildify(uri.path.fsPath(), home),
                buttons: [this.removeRecentWorkspaceButton],
                resource: uri,
                execute: () => {
                    const current = this.workspaceService.workspace;
                    if ((current && current.resource.toString() !== workspace) || !current) {
                        this.workspaceService.open(uri);
                    }
                }
            });
        }

        this.quickInputService?.showQuickPick(items, {
            placeholder: nls.localize(
                'theia/workspace/openRecentPlaceholder',
                'Type the name of the workspace you want to open'),
            onDidTriggerItemButton: async context => {
                const resource = (context.item as RecentlyOpenedPick).resource;
                if (resource) {
                    await this.workspaceService.removeRecentWorkspace(resource.toString());
                    context.removeItem();
                }
            }
        });
    }
}
