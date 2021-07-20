import { injectable, interfaces } from 'inversify';
import { AbstractViewContribution, bindViewContribution, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';

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

export function bindVesDocumentationIFrameViewViews(bind: interfaces.Bind): void {
    bindViewContribution(bind, VesDocumentationIFrameViewContribution);
    bind(FrontendApplicationContribution).toService(
        VesDocumentationIFrameViewContribution
    );
    bind(VesDocumentationIFrameWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: VesDocumentationIFrameWidget.ID,
        createWidget: () => ctx.container.get<VesDocumentationIFrameWidget>(VesDocumentationIFrameWidget),
    })).inSingletonScope();
}
