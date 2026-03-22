import { CommandService } from '@theia/core';
import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { BrightnessRepeatAssetsBrowserWidget } from './brightness-repeat-assets-browser-widget';

@injectable()
export class BrightnessRepeatAssetsBrowserViewContribution extends AbstractViewContribution<BrightnessRepeatAssetsBrowserWidget> {
    @inject(CommandService)
    protected readonly commandService: CommandService;

    constructor() {
        super({
            widgetId: BrightnessRepeatAssetsBrowserWidget.ID,
            widgetName: BrightnessRepeatAssetsBrowserWidget.LABEL,
            defaultWidgetOptions: {
                area: 'left',
                rank: -10000,
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
    }
}
