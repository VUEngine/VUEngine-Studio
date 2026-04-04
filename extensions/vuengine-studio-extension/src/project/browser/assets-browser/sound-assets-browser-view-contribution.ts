import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { SoundAssetsBrowserWidget } from './sound-assets-browser-widget';

@injectable()
export class SoundAssetsBrowserViewContribution extends AbstractViewContribution<SoundAssetsBrowserWidget> {
    constructor() {
        super({
            widgetId: SoundAssetsBrowserWidget.ID,
            widgetName: SoundAssetsBrowserWidget.LABEL,
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
