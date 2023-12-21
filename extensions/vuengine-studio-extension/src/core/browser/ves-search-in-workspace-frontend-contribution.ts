import { FrontendApplication } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { SearchInWorkspaceFrontendContribution } from '@theia/search-in-workspace/lib/browser/search-in-workspace-frontend-contribution';

@injectable()
export class VesSearchInWorkspaceFrontendContribution extends SearchInWorkspaceFrontendContribution {
    async initializeLayout(app: FrontendApplication): Promise<void> {
        // initially hide if no workspace is opened
        if (this.workspaceService.opened) {
            await super.initializeLayout(app);
        }
    }
}
