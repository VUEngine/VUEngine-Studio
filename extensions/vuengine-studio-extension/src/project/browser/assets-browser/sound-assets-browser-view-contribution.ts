import { CommandService } from '@theia/core';
import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { SoundAssetsBrowserWidget } from './sound-assets-browser-widget';

@injectable()
export class SoundAssetsBrowserViewContribution extends AbstractViewContribution<SoundAssetsBrowserWidget> {
    @inject(CommandService)
    protected readonly commandService: CommandService;

    constructor() {
        super({
            widgetId: SoundAssetsBrowserWidget.ID,
            widgetName: SoundAssetsBrowserWidget.LABEL,
            defaultWidgetOptions: {
                area: 'left',
                rank: -10000,
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
    }
}
