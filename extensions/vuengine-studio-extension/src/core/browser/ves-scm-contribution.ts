import { inject, injectable } from '@theia/core/shared/inversify';
import { ScmContribution } from '@theia/scm/lib/browser/scm-contribution';
import { WorkspaceService } from '@theia/workspace/lib/browser';

@injectable()
export class VesScmContribution extends ScmContribution {
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    async initializeLayout(): Promise<void> {
        // initially hide if no workspace is opened
        if (this.workspaceService.opened) {
            await super.initializeLayout();
        }
    }
}
