import { injectable, interfaces, postConstruct } from 'inversify';
import { isOSX } from '@theia/core';
import { AbstractViewContribution, bindViewContribution, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';
import { VesTitlebarWindowControlsWidget } from './window-controls-widget';

@injectable()
export class VesTitlebarWindowControlsContribution extends AbstractViewContribution<VesTitlebarWindowControlsWidget> {

    constructor() {
        super({
            widgetId: VesTitlebarWindowControlsWidget.ID,
            widgetName: VesTitlebarWindowControlsWidget.LABEL,
            defaultWidgetOptions: { area: 'top' }
        });
    }

    @postConstruct()
    protected async init(): Promise<void> {
        await this.openView({ activate: true, reveal: true });
    }
}

export function bindVesTitlebarWindowControlsViews(bind: interfaces.Bind): void {
    if (!isOSX) {
        bindViewContribution(bind, VesTitlebarWindowControlsContribution);
        bind(FrontendApplicationContribution).toService(VesTitlebarWindowControlsContribution);
        bind(VesTitlebarWindowControlsWidget).toSelf();
        bind(WidgetFactory)
            .toDynamicValue((ctx) => ({
                id: VesTitlebarWindowControlsWidget.ID,
                createWidget: () =>
                    ctx.container.get<VesTitlebarWindowControlsWidget>(
                        VesTitlebarWindowControlsWidget
                    ),
            }))
            .inSingletonScope();
    }
}