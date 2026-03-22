import { CommandService } from '@theia/core';
import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { ActorAssetsBrowserWidget } from './actor-assets-browser-widget';

@injectable()
export class ActorAssetsBrowserViewContribution extends AbstractViewContribution<ActorAssetsBrowserWidget> {
    @inject(CommandService)
    protected readonly commandService: CommandService;

    constructor() {
        super({
            widgetId: ActorAssetsBrowserWidget.ID,
            widgetName: ActorAssetsBrowserWidget.LABEL,
            defaultWidgetOptions: {
                area: 'left',
                rank: -10000,
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
    }
}
