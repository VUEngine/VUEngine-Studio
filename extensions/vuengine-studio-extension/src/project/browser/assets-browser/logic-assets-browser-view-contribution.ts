import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { LogicAssetsBrowserWidget } from './logic-assets-browser-widget';

@injectable()
export class LogicAssetsBrowserViewContribution extends AbstractViewContribution<LogicAssetsBrowserWidget> {
    constructor() {
        super({
            widgetId: LogicAssetsBrowserWidget.ID,
            widgetName: LogicAssetsBrowserWidget.LABEL,
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
