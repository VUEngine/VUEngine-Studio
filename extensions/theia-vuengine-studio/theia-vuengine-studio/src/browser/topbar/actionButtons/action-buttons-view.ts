import { injectable, interfaces } from 'inversify';
import { VesTopbarActionButtonsWidget } from './action-buttons-widget';
import { AbstractViewContribution, bindViewContribution, FrontendApplication, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';

@injectable()
export class VesTopbarActionButtonsContribution extends AbstractViewContribution<VesTopbarActionButtonsWidget> {

    constructor() {
        super({
            widgetId: VesTopbarActionButtonsWidget.ID,
            widgetName: VesTopbarActionButtonsWidget.LABEL,
            defaultWidgetOptions: { area: 'top' }
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: false, reveal: true });
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
