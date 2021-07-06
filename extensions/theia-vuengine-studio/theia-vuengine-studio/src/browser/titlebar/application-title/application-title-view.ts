import { injectable, interfaces, postConstruct } from 'inversify';
import { AbstractViewContribution, bindViewContribution, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';
import { VesTitlebarApplicationTitleWidget } from './application-title-widget';

@injectable()
export class VesTitlebarApplicationTitleContribution extends AbstractViewContribution<VesTitlebarApplicationTitleWidget> {

    constructor() {
        super({
            widgetId: VesTitlebarApplicationTitleWidget.ID,
            widgetName: VesTitlebarApplicationTitleWidget.LABEL,
            defaultWidgetOptions: { area: 'top' }
        });
    }

    @postConstruct()
    protected async init(): Promise<void> {
        await this.openView({ activate: true, reveal: true });
    }
}

export function bindVesTitlebarApplicationTitleViews(bind: interfaces.Bind): void {
    bindViewContribution(bind, VesTitlebarApplicationTitleContribution);
    bind(FrontendApplicationContribution).toService(
        VesTitlebarApplicationTitleContribution
    );
    bind(VesTitlebarApplicationTitleWidget).toSelf();
    bind(WidgetFactory)
        .toDynamicValue((ctx) => ({
            id: VesTitlebarApplicationTitleWidget.ID,
            createWidget: () =>
                ctx.container.get<VesTitlebarApplicationTitleWidget>(
                    VesTitlebarApplicationTitleWidget
                ),
        }))
        .inSingletonScope();
}
