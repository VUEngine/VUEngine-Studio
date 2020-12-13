import { injectable, postConstruct } from 'inversify';
import { VesTopbarActionButtonsWidget } from './action-buttons-widget';
import { AbstractViewContribution } from '@theia/core/lib/browser';

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
