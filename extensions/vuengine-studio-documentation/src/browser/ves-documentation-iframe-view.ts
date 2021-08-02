import { injectable } from '@theia/core/shared/inversify';
import { AbstractViewContribution } from '@theia/core/lib/browser';

import { VesDocumentationIFrameWidget } from './ves-documentation-iframe-widget';

@injectable()
export class VesDocumentationIFrameViewContribution extends AbstractViewContribution<VesDocumentationIFrameWidget> {

    constructor() {
        super({
            widgetId: VesDocumentationIFrameWidget.ID,
            widgetName: VesDocumentationIFrameWidget.LABEL,
            defaultWidgetOptions: { area: 'main' },
        });
    }
}
