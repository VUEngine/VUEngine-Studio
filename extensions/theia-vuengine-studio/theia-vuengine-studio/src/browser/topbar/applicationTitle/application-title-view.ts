import { injectable, postConstruct } from 'inversify';
import { VesTopbarApplicationTitleWidget } from './application-title-widget';
import { AbstractViewContribution } from '@theia/core/lib/browser';

@injectable()
export class VesTopbarApplicationTitleContribution extends AbstractViewContribution<VesTopbarApplicationTitleWidget> {

    constructor() {
        super({
            widgetId: VesTopbarApplicationTitleWidget.ID,
            widgetName: VesTopbarApplicationTitleWidget.LABEL,
            defaultWidgetOptions: { area: 'top' }
        });
    }

    @postConstruct()
    protected async init(): Promise<void> {
        this.openView({ activate: false, reveal: true });
    }
}
