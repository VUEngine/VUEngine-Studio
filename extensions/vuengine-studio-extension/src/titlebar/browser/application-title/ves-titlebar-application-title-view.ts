import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { AbstractViewContribution } from '@theia/core/lib/browser';
import { VesTitlebarApplicationTitleWidget } from './ves-titlebar-application-title-widget';

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
    protected init(): void {
        this.openView({ activate: true, reveal: true });
    }
}
