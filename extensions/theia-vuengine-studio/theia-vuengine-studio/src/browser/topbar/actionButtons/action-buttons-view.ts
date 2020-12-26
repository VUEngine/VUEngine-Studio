import { injectable, interfaces, postConstruct } from 'inversify';
import { VesTopbarActionButtonsWidget } from './action-buttons-widget';
import { AbstractViewContribution, bindViewContribution, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';

@injectable()
export class VesTopbarActionButtonsContribution extends AbstractViewContribution<VesTopbarActionButtonsWidget> {

    constructor() {
        super({
            widgetId: VesTopbarActionButtonsWidget.ID,
            widgetName: VesTopbarActionButtonsWidget.LABEL,
            defaultWidgetOptions: { area: 'top' }
        });
    }

    @postConstruct()
    protected async init(): Promise<void> {
        this.openView({ activate: false, reveal: true });
    }
}

export function bindVesTopbarActionButtonsViews(bind: interfaces.Bind): void {
    bindViewContribution(bind, VesTopbarActionButtonsContribution);
    bind(FrontendApplicationContribution).toService(VesTopbarActionButtonsContribution);
    bind(VesTopbarActionButtonsWidget).toSelf();
    bind(WidgetFactory)
        .toDynamicValue((ctx) => ({
            id: VesTopbarActionButtonsWidget.ID,
            createWidget: () =>
                ctx.container.get<VesTopbarActionButtonsWidget>(
                    VesTopbarActionButtonsWidget
                ),
        }))
        .inSingletonScope();
}
