import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { AbstractViewContribution } from '@theia/core/lib/browser';
import { VesTitlebarActionButtonsWidget } from './ves-titlebar-action-buttons-widget';

@injectable()
export class VesTitlebarActionButtonsContribution extends AbstractViewContribution<VesTitlebarActionButtonsWidget> {

    constructor() {
        super({
            widgetId: VesTitlebarActionButtonsWidget.ID,
            widgetName: VesTitlebarActionButtonsWidget.LABEL,
            defaultWidgetOptions: { area: 'top' }
        });
    }

    @postConstruct()
    protected async init(): Promise<void> {
        await this.openView({ activate: true, reveal: true });
    }
}
