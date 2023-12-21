import { FrontendApplication } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { FileNavigatorContribution } from '@theia/navigator/lib/browser/navigator-contribution';

@injectable()
export class VesFileNavigatorContribution extends FileNavigatorContribution {
    async initializeLayout(app: FrontendApplication): Promise<void> {
        // initially open file explorer for workspaces, hide otherwise
        if (this.workspaceService.opened) {
            await this.openView({
                activate: true,
                reveal: true,
            });
        }
    }
}
