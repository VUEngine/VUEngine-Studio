import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { ColumnTableAssetsBrowserWidget } from './column-table-assets-browser-widget';

@injectable()
export class ColumnTableAssetsBrowserViewContribution extends AbstractViewContribution<ColumnTableAssetsBrowserWidget> {
    constructor() {
        super({
            widgetId: ColumnTableAssetsBrowserWidget.ID,
            widgetName: ColumnTableAssetsBrowserWidget.LABEL,
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
