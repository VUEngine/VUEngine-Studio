import { injectable, interfaces, postConstruct } from 'inversify';
import { VesTopbarWindowControlsWidget } from './window-controls-widget';
import { AbstractViewContribution, bindViewContribution, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';
import { isOSX } from '@theia/core';

@injectable()
export class VesTopbarWindowControlsContribution extends AbstractViewContribution<VesTopbarWindowControlsWidget> {

    constructor() {
        super({
            widgetId: VesTopbarWindowControlsWidget.ID,
            widgetName: VesTopbarWindowControlsWidget.LABEL,
            defaultWidgetOptions: { area: 'top' }
        });
    }

    @postConstruct()
    protected async init(): Promise<void> {
        await this.openView({ activate: true, reveal: true });
    }
}

export function bindVesTopbarWindowControlsViews(bind: interfaces.Bind): void {
    if (!isOSX) {
        bindViewContribution(bind, VesTopbarWindowControlsContribution);
        bind(FrontendApplicationContribution).toService(VesTopbarWindowControlsContribution);
        bind(VesTopbarWindowControlsWidget).toSelf();
        bind(WidgetFactory)
            .toDynamicValue((ctx) => ({
                id: VesTopbarWindowControlsWidget.ID,
                createWidget: () =>
                    ctx.container.get<VesTopbarWindowControlsWidget>(
                        VesTopbarWindowControlsWidget
                    ),
            }))
            .inSingletonScope();
    }
}