import { injectable, interfaces, postConstruct } from 'inversify';
import { AbstractViewContribution, bindViewContribution, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';
import { VesTopbarApplicationTitleWidget } from './application-title-widget';

@injectable()
export class VesTopbarApplicationTitleContribution extends AbstractViewContribution<VesTopbarApplicationTitleWidget> {

    constructor() {
        super({
            widgetId: VesTopbarApplicationTitleWidget.ID,
            widgetName: VesTopbarApplicationTitleWidget.LABEL,
            defaultWidgetOptions: { area: 'top' }
        });
    }

    @postConstruct()
    protected async init(): Promise<void> {
        await this.openView({ activate: true, reveal: true });
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