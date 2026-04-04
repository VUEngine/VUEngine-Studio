import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { ActorAssetsBrowserWidget } from './actor-assets-browser-widget';

@injectable()
export class ActorAssetsBrowserViewContribution extends AbstractViewContribution<ActorAssetsBrowserWidget> {
    constructor() {
        super({
            widgetId: ActorAssetsBrowserWidget.ID,
            widgetName: ActorAssetsBrowserWidget.LABEL,
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
