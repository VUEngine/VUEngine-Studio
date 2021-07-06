import { injectable, interfaces, postConstruct } from 'inversify';
import { VesTitlebarActionButtonsWidget } from './action-buttons-widget';
import { AbstractViewContribution, bindViewContribution, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';

@injectable()
export class VesTitlebarActionButtonsContribution extends AbstractViewContribution<VesTitlebarActionButtonsWidget> {

    constructor() {
        super({
            widgetId: VesTitlebarActionButtonsWidget.ID,
            widgetName: VesTitlebarActionButtonsWidget.LABEL,
            defaultWidgetOptions: { area: 'top' }
        });
    }

    @postConstruct()
    protected async init(): Promise<void> {
        await this.openView({ activate: true, reveal: true });
    }
}

export function bindVesTitlebarActionButtonsViews(bind: interfaces.Bind): void {
    bindViewContribution(bind, VesTitlebarActionButtonsContribution);
    bind(FrontendApplicationContribution).toService(VesTitlebarActionButtonsContribution);
    bind(VesTitlebarActionButtonsWidget).toSelf();
    bind(WidgetFactory)
        .toDynamicValue((ctx) => ({
            id: VesTitlebarActionButtonsWidget.ID,
            createWidget: () =>
                ctx.container.get<VesTitlebarActionButtonsWidget>(
                    VesTitlebarActionButtonsWidget
                ),
        }))
        .inSingletonScope();
}
