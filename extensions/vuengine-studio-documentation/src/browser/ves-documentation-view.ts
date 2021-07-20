import { injectable } from 'inversify';
import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';

import { VesDocumentationWidget } from './ves-documentation-widget';

@injectable()
export class VesDocumentationViewContribution extends AbstractViewContribution<VesDocumentationWidget> {
    constructor() {
        super({
            widgetId: VesDocumentationWidget.ID,
            widgetName: VesDocumentationWidget.LABEL,
            defaultWidgetOptions: {
                area: 'right',
                rank: 800,
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView();
    }
}
