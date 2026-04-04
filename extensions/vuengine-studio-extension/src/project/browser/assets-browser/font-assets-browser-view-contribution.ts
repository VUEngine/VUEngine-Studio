import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { FontAssetsBrowserWidget } from './font-assets-browser-widget';

@injectable()
export class FontAssetsBrowserViewContribution extends AbstractViewContribution<FontAssetsBrowserWidget> {
    constructor() {
        super({
            widgetId: FontAssetsBrowserWidget.ID,
            widgetName: FontAssetsBrowserWidget.LABEL,
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
