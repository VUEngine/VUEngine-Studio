import { CommandService } from '@theia/core';
import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { RumbleEffectAssetsBrowserWidget } from './rumble-effect-assets-browser-widget';

@injectable()
export class RumbleEffectAssetsBrowserViewContribution extends AbstractViewContribution<RumbleEffectAssetsBrowserWidget> {
    @inject(CommandService)
    protected readonly commandService: CommandService;

    constructor() {
        super({
            widgetId: RumbleEffectAssetsBrowserWidget.ID,
            widgetName: RumbleEffectAssetsBrowserWidget.LABEL,
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
