import { injectable, interfaces } from 'inversify';
import { AbstractViewContribution, bindViewContribution, FrontendApplicationContribution, OpenHandler, WidgetFactory } from '@theia/core/lib/browser';
import { VesEmulatorWidget, VesEmulatorWidgetOptions } from './emulator-widget';
import { VesEmulatorOpenHandler } from './emulator-open-handler';

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
    bind(OpenHandler).to(VesEmulatorOpenHandler).inSingletonScope();
    bind(VesEmulatorWidget).toSelf();
    bind(WidgetFactory)
        .toDynamicValue(({ container }) => ({
            id: VesEmulatorWidget.ID,
            createWidget: (options: VesEmulatorWidgetOptions) => {
                const child = container.createChild();
                child.bind(VesEmulatorWidgetOptions).toConstantValue(options);
                child.bind(VesEmulatorWidget).toSelf();
                return child.get(VesEmulatorWidget);
            }

        }))
        .inSingletonScope();
}
