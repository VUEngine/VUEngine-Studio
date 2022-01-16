import { AbstractViewContribution, FrontendApplication, FrontendApplicationContribution, PreferenceService } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { GettingStartedWidget } from '@theia/getting-started/lib/browser/getting-started-widget';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesGettingStartedWidget } from './ves-branding-getting-started-widget';
import { VesBrandingPreferenceIds } from './ves-branding-preferences';

@injectable()
export class VesGettingStartedViewContribution extends AbstractViewContribution<VesGettingStartedWidget> implements FrontendApplicationContribution {
    @inject(FrontendApplicationStateService)
    protected readonly stateService: FrontendApplicationStateService;
    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    constructor() {
        super({
            widgetId: GettingStartedWidget.ID,
            widgetName: GettingStartedWidget.LABEL,
            defaultWidgetOptions: {
                area: 'main',
            }
        });
    }

    async onStart(app: FrontendApplication): Promise<void> {
        if (!this.workspaceService.opened) {
            this.stateService.reachedState('ready').then(
                () => this.preferenceService.ready.then(() => {
                    const showWelcomePage: boolean = this.preferenceService.get(VesBrandingPreferenceIds.ALWAYS_SHOW_WELCOME_PAGE, true);
                    if (showWelcomePage) {
                        this.openView({ reveal: true });
                    }
                })
            );
        }
    }
}
