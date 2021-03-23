import { injectable, interfaces } from 'inversify';
import { VesTopbarApplicationTitleWidget } from './application-title-widget';
import { AbstractViewContribution, bindViewContribution, FrontendApplication, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';

@injectable()
export class VesTopbarApplicationTitleContribution extends AbstractViewContribution<VesTopbarApplicationTitleWidget> {

    constructor() {
        super({
            widgetId: VesTopbarApplicationTitleWidget.ID,
            widgetName: VesTopbarApplicationTitleWidget.LABEL,
            defaultWidgetOptions: { area: 'top' }
        });
    }


    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: false, reveal: true });
    }
}

export function bindVesTopbarApplicationTitleViews(bind: interfaces.Bind): void {
    bindViewContribution(bind, VesTopbarApplicationTitleContribution);
    bind(FrontendApplicationContribution).toService(
        VesTopbarApplicationTitleContribution
    );
    bind(VesTopbarApplicationTitleWidget).toSelf();
    bind(WidgetFactory)
        .toDynamicValue((ctx) => ({
            id: VesTopbarApplicationTitleWidget.ID,
            createWidget: () =>
                ctx.container.get<VesTopbarApplicationTitleWidget>(
                    VesTopbarApplicationTitleWidget
                ),
        }))
        .inSingletonScope();
}
