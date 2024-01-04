import { FrontendApplication } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { FileNavigatorContribution } from '@theia/navigator/lib/browser/navigator-contribution';

@injectable()
export class VesFileNavigatorContribution extends FileNavigatorContribution {
    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.workspaceService.ready;
        // initially open file explorer for workspaces
        await this.openView({
            activate: this.workspaceService.opened,
            reveal: this.workspaceService.opened,
        });
    }
}
