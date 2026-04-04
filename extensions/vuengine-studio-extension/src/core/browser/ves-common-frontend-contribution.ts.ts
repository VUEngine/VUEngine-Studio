import { CoreConfiguration, PreferenceChangeEvent } from '@theia/core';
import { CommonFrontendContribution, FrontendApplication } from '@theia/core/lib/browser';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { FrontendApplicationState } from '@theia/core/lib/common/frontend-application-state';
import { inject, injectable } from '@theia/core/shared/inversify';

@injectable()
export class VesCommonFrontendContribution extends CommonFrontendContribution {
    @inject(FrontendApplicationStateService)
    protected readonly frontendApplicationStateService: FrontendApplicationStateService;

    async configure(app: FrontendApplication): Promise<void> {
        super.configure(app);

        this.frontendApplicationStateService.onStateChanged(
            async (state: FrontendApplicationState) => {
                if (state === 'attached_shell') {
                    app.shell.leftPanelHandler.removeBottomMenu('settings-menu');
                }
            }
        );
    }

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
