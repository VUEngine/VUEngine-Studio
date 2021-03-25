import { injectable, interfaces } from 'inversify';
import { AbstractViewContribution, bindViewContribution, FrontendApplication, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';
import { VesBuildWidget } from './build-widget';

@injectable()
export class VesBuildWidgetContribution extends AbstractViewContribution<VesBuildWidget> {
    constructor() {
        super({
            widgetId: VesBuildWidget.ID,
            widgetName: VesBuildWidget.LABEL,
            defaultWidgetOptions: {
                area: 'right',
                rank: 700,
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView();
    }
}

export function bindVesBuildView(bind: interfaces.Bind): void {
    bindViewContribution(bind, VesBuildWidgetContribution);
    bind(FrontendApplicationContribution).toService(
        VesBuildWidgetContribution
    );
    bind(VesBuildWidget).toSelf();
    bind(WidgetFactory)
        .toDynamicValue((ctx) => ({
            id: VesBuildWidget.ID,
            createWidget: () =>
                ctx.container.get<VesBuildWidget>(
                    VesBuildWidget
                ),
        }))
        .inSingletonScope();
}
