import { nls, Path } from '@theia/core';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileStat } from '@theia/filesystem/lib/common/files';
import { QuickOpenWorkspace } from '@theia/workspace/lib/browser/quick-open-workspace';
import { VesProjectsService } from '../../projects/browser/ves-projects-service';
import { VesCommonService } from './ves-common-service';

@injectable()
export class VesQuickOpenWorkspace extends QuickOpenWorkspace {
    @inject(VesCommonService)
    protected readonly vesCommonService: VesCommonService;
    @inject(VesProjectsService)
    protected readonly vesProjectsService: VesProjectsService;

    // TODO: had to override the entire function to change two lines (marked below),
    // ensure to keep this up to date with Theia
    async open(workspaces: string[]): Promise<void> {
        this.items = [];
        const [homeDirUri, tempWorkspaceFile] = await Promise.all([
            this.envServer.getHomeDirUri(),
            this.workspaceService.getUntitledWorkspace()
        ]);
        const home = new URI(homeDirUri).path.toString();
        await this.preferences.ready;
        this.items.push({
            type: 'separator',
            label: nls.localizeByDefault('folders & workspaces')
        });
        for (const workspace of workspaces) {
            const uri = new URI(workspace);
            let stat: FileStat | undefined;
            try {
                stat = await this.fileService.resolve(uri);
            } catch { }
            if (!stat ||
                !this.preferences['workspace.supportMultiRootWorkspace'] && !stat.isDirectory) {
                continue; // skip the workspace files if multi root is not supported
            }
            if (uri.toString() === tempWorkspaceFile.toString()) {
                continue; // skip the temporary workspace files
            }
            const icon = this.labelProvider.getIcon(stat);
            const iconClasses = icon === '' ? undefined : [icon + ' file-icon'];

            this.items.push({
                label: await this.vesProjectsService.getProjectName(uri), // Modified line
                description: this.vesCommonService.formatPath(Path.tildify(uri.path.toString(), home)), // Modified line
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
                const resource = context.item.resource;
                if (resource) {
                    await this.workspaceService.removeRecentWorkspace(resource.toString());
                    context.removeItem();
                }
            }
        });
    }
}
