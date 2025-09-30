import { MAIN_MENU_BAR, nls, PreferenceService } from '@theia/core';
import { ApplicationShell, FrontendApplication, FrontendApplicationContribution } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';

@injectable()
export class VesCoreCompactMainMenuContribution implements FrontendApplicationContribution {
    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;
    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    onStart(app: FrontendApplication): void {
        this.initiateCompactMainMenu();
    };

    initiateCompactMainMenu(): void {
        const menuBarVisibility = this.preferenceService.get('window.menuBarVisibility');
        if (menuBarVisibility === 'compact') {
            this.shell.leftPanelHandler.addTopMenu({
                id: 'main-menu',
                iconClass: 'codicon codicon-menu',
                title: nls.localizeByDefault('Application Menu'),
                menuPath: MAIN_MENU_BAR,
                order: 0,
            });
        }
    }
}
