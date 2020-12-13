import { injectable } from 'inversify';
import { FrontendApplication } from '@theia/core/lib/browser';
import { ElectronMenuContribution } from '@theia/core/lib/electron-browser/menu/electron-menu-contribution';

@injectable()
export class VesElectronMenuContribution extends ElectronMenuContribution {
    protected hideTopPanel(app: FrontendApplication): void {
        // override this with an empty function so the top panel is not removed in electron
    }
}