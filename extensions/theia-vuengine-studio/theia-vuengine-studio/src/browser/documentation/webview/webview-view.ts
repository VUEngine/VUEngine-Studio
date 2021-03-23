import { injectable, interfaces } from 'inversify';
import { AbstractViewContribution, bindViewContribution, FrontendApplication, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';
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

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView();
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
