import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { PixelAssetsBrowserWidget } from './pixel-assets-browser-widget';

@injectable()
export class PixelAssetsBrowserViewContribution extends AbstractViewContribution<PixelAssetsBrowserWidget> {
    constructor() {
        super({
            widgetId: PixelAssetsBrowserWidget.ID,
            widgetName: PixelAssetsBrowserWidget.LABEL,
            defaultWidgetOptions: {
                area: 'left',
                rank: 300,
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: false, reveal: false });
    }
}
