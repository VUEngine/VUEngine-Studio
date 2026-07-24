import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { PcmAssetsBrowserWidget } from './pcm-assets-browser-widget';

@injectable()
export class PcmAssetsBrowserViewContribution extends AbstractViewContribution<PcmAssetsBrowserWidget> {
    constructor() {
        super({
            widgetId: PcmAssetsBrowserWidget.ID,
            widgetName: PcmAssetsBrowserWidget.LABEL,
            defaultWidgetOptions: {
                area: 'left',
                rank: 200,
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: true, reveal: true });
    }
}
