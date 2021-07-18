import { AbstractViewContribution, FrontendApplication, FrontendApplicationContribution } from '@theia/core/lib/browser';
import { inject, injectable } from 'inversify';

import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { GettingStartedWidget } from '@theia/getting-started/lib/browser/getting-started-widget';
import { VesGettingStartedWidget } from './ves-branding-getting-started-widget';
import { WorkspaceService } from '@theia/workspace/lib/browser';

@injectable()
export class VesGettingStartedViewContribution extends AbstractViewContribution<VesGettingStartedWidget> implements FrontendApplicationContribution {
    @inject(FrontendApplicationStateService)
    protected readonly stateService: FrontendApplicationStateService;
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
                () => this.openView({ reveal: true })
            );
        }
    }
}
