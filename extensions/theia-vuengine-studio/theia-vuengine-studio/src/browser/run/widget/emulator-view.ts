import { injectable, interfaces } from 'inversify';
import { AbstractViewContribution, bindViewContribution, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';
import { VesEmulatorWidget } from './emulator-widget';

@injectable()
export class VesEmulatorContribution extends AbstractViewContribution<VesEmulatorWidget> {

    constructor() {
        super({
            widgetId: VesEmulatorWidget.ID,
            widgetName: VesEmulatorWidget.LABEL,
            defaultWidgetOptions: { area: 'main' },
        });
    }
}

export function bindVesEmulatorView(bind: interfaces.Bind): void {
    bindViewContribution(bind, VesEmulatorContribution);
    bind(FrontendApplicationContribution).toService(
        VesEmulatorContribution
    );
    bind(VesEmulatorWidget).toSelf();
    bind(WidgetFactory)
        .toDynamicValue((ctx) => ({
            id: VesEmulatorWidget.ID,
            createWidget: () =>
                ctx.container.get<VesEmulatorWidget>(
                    VesEmulatorWidget
                ),
        }))
        .inSingletonScope();
}