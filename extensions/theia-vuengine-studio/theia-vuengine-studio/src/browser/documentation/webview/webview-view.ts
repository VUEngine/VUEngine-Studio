import { injectable, interfaces, postConstruct } from 'inversify';
import { AbstractViewContribution, bindViewContribution, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';
import { VesWebViewWidget } from './webview-widget';

@injectable()
export class VesWebViewContribution extends AbstractViewContribution<VesWebViewWidget> {

    constructor() {
        super({
            widgetId: VesWebViewWidget.ID,
            widgetName: VesWebViewWidget.LABEL,
            defaultWidgetOptions: { area: 'main' },
        });
    }

    @postConstruct()
    protected async init(): Promise<void> {
        //this.openView({ activate: true, reveal: true });
    }
}

export function bindVesWebViewViews(bind: interfaces.Bind): void {
    bindViewContribution(bind, VesWebViewContribution);
    bind(FrontendApplicationContribution).toService(
        VesWebViewContribution
    );
    bind(VesWebViewWidget).toSelf();
    bind(WidgetFactory)
        .toDynamicValue((ctx) => ({
            id: VesWebViewWidget.ID,
            createWidget: () =>
                ctx.container.get<VesWebViewWidget>(
                    VesWebViewWidget
                ),
        }))
        .inSingletonScope();
}
