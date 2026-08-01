import { FrontendApplication } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { VSXExtensionsContribution } from '@theia/vsx-registry/lib/browser/vsx-extensions-contribution';

@injectable()
export class VesVSXExtensionsContribution extends VSXExtensionsContribution {
    async initializeLayout(app: FrontendApplication): Promise<void> {
        // do not initially open view
    }
}
