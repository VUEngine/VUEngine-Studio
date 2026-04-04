import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { StageAssetsBrowserWidget } from './stage-assets-browser-widget';

@injectable()
export class StageAssetsBrowserViewContribution extends AbstractViewContribution<StageAssetsBrowserWidget> {
    constructor() {
        super({
            widgetId: StageAssetsBrowserWidget.ID,
            widgetName: StageAssetsBrowserWidget.LABEL,
            defaultWidgetOptions: {
                area: 'left',
                rank: 100,
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: true, reveal: true });
    }
}
