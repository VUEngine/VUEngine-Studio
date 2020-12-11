import { injectable, postConstruct } from 'inversify';
import { VesTopbarWidget } from './widget';
import { AbstractViewContribution } from '@theia/core/lib/browser';

@injectable()
export class VesTopbarContribution extends AbstractViewContribution<VesTopbarWidget> {

    constructor() {
        super({
            widgetId: VesTopbarWidget.ID,
            widgetName: VesTopbarWidget.LABEL,
            defaultWidgetOptions: { area: 'top' }
        });
    }

    @postConstruct()
    protected async init(): Promise<void> {
        this.openView({ activate: false, reveal: true });
    }
}
