import { injectable, postConstruct } from 'inversify';
import { VesTopbarWindowControlsWidget } from './window-controls-widget';
import { AbstractViewContribution } from '@theia/core/lib/browser';

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
        this.openView({ activate: false, reveal: true });
    }
}
