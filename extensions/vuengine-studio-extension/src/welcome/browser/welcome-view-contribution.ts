import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { WelcomeWidget } from './welcome-widget';
import { WorkspaceService } from '@theia/workspace/lib/browser';

@injectable()
export class WelcomeViewContribution extends AbstractViewContribution<WelcomeWidget> {
    @inject(WorkspaceService)
    protected readonly workspaceService!: WorkspaceService;

    constructor() {
        super({
            widgetId: WelcomeWidget.ID,
            widgetName: WelcomeWidget.LABEL,
            defaultWidgetOptions: {
                area: 'main',
                rank: -600,
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        if (!this.workspaceService.opened) {
            await this.openView({ activate: true, reveal: true });
        }
    }
}
