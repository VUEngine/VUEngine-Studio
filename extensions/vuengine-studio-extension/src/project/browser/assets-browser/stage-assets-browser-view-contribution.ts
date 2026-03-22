import { CommandService } from '@theia/core';
import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { StageAssetsBrowserWidget } from './stage-assets-browser-widget';

@injectable()
export class StageAssetsBrowserViewContribution extends AbstractViewContribution<StageAssetsBrowserWidget> {
    @inject(CommandService)
    protected readonly commandService: CommandService;

    constructor() {
        super({
            widgetId: StageAssetsBrowserWidget.ID,
            widgetName: StageAssetsBrowserWidget.LABEL,
            defaultWidgetOptions: {
                area: 'left',
                rank: -10000,
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
    }
}
