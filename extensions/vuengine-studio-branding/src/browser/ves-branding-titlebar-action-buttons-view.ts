import { injectable, postConstruct } from 'inversify';
import { VesTitlebarActionButtonsWidget } from './ves-branding-titlebar-action-buttons-widget';
import { AbstractViewContribution } from '@theia/core/lib/browser';

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
