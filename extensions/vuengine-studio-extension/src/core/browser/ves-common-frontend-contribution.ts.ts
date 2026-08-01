import { CoreConfiguration, PreferenceChangeEvent } from '@theia/core';
import { CommonFrontendContribution, FrontendApplication } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';

@injectable()
export class VesCommonFrontendContribution extends CommonFrontendContribution {
    protected handlePreferenceChange(e: PreferenceChangeEvent<CoreConfiguration>, app: FrontendApplication): void {
        super.handlePreferenceChange(e, app);

        switch (e.preferenceName) {
            case 'window.menuBarVisibility': {
                const mainMenuId = 'main-menu';
                app.shell.leftPanelHandler.removeTopMenu(mainMenuId);
                break;
            }
        }
    }
}
