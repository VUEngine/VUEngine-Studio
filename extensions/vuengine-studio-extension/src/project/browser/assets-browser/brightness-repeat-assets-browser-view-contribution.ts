import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { BrightnessRepeatAssetsBrowserWidget } from './brightness-repeat-assets-browser-widget';

@injectable()
export class BrightnessRepeatAssetsBrowserViewContribution extends AbstractViewContribution<BrightnessRepeatAssetsBrowserWidget> {
    constructor() {
        super({
            widgetId: BrightnessRepeatAssetsBrowserWidget.ID,
            widgetName: BrightnessRepeatAssetsBrowserWidget.LABEL,
            defaultWidgetOptions: {
                area: 'left',
                rank: 100,
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: false, reveal: false });
    }
}
