import { injectable, interfaces, postConstruct } from 'inversify';
import { AbstractViewContribution, bindViewContribution, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';
import { VesFlashCartWidget } from './flash-cart-widget';

@injectable()
export class VesFlashCartWidgetContribution extends AbstractViewContribution<VesFlashCartWidget> {

    constructor() {
        super({
            widgetId: VesFlashCartWidget.ID,
            widgetName: VesFlashCartWidget.LABEL,
            defaultWidgetOptions: {
                area: 'right',
                rank: 800,
            },
        });
    }

    @postConstruct()
    protected async init(): Promise<void> {
        this.openView({ activate: true });
    }
}

export function bindVesFlashCartsView(bind: interfaces.Bind): void {
    bindViewContribution(bind, VesFlashCartWidgetContribution);
    bind(FrontendApplicationContribution).toService(
        VesFlashCartWidgetContribution
    );
    bind(VesFlashCartWidget).toSelf();
    bind(WidgetFactory)
        .toDynamicValue((ctx) => ({
            id: VesFlashCartWidget.ID,
            createWidget: () =>
                ctx.container.get<VesFlashCartWidget>(
                    VesFlashCartWidget
                ),
        }))
        .inSingletonScope();
}
