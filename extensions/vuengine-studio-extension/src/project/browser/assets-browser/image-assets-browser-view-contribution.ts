import { CommandService } from '@theia/core';
import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { ImageAssetsBrowserWidget } from './image-assets-browser-widget';

@injectable()
export class ImageAssetsBrowserViewContribution extends AbstractViewContribution<ImageAssetsBrowserWidget> {
    @inject(CommandService)
    protected readonly commandService: CommandService;

    constructor() {
        super({
            widgetId: ImageAssetsBrowserWidget.ID,
            widgetName: ImageAssetsBrowserWidget.LABEL,
            defaultWidgetOptions: {
                area: 'left',
                rank: 1,
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: false, reveal: false });
    }
}
