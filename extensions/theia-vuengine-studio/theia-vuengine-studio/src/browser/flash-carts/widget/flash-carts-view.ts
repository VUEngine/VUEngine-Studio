import { injectable, interfaces, postConstruct } from 'inversify';
import { AbstractViewContribution, bindViewContribution, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';
import { VesFlashCartsWidget } from './flash-carts-widget';

@injectable()
export class VesFlashCartsWidgetContribution extends AbstractViewContribution<VesFlashCartsWidget> {

    constructor() {
        super({
            widgetId: VesFlashCartsWidget.ID,
            widgetName: VesFlashCartsWidget.LABEL,
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
    bindViewContribution(bind, VesFlashCartsWidgetContribution);
    bind(FrontendApplicationContribution).toService(
        VesFlashCartsWidgetContribution
    );
    bind(VesFlashCartsWidget).toSelf();
    bind(WidgetFactory)
        .toDynamicValue((ctx) => ({
            id: VesFlashCartsWidget.ID,
            createWidget: () =>
                ctx.container.get<VesFlashCartsWidget>(
                    VesFlashCartsWidget
                ),
        }))
        .inSingletonScope();
}
