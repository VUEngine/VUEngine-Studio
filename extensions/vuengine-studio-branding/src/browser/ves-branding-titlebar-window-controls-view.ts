import { injectable, postConstruct } from 'inversify';
import { AbstractViewContribution } from '@theia/core/lib/browser';

import { VesTitlebarWindowControlsWidget } from './ves-branding-titlebar-window-controls-widget';

@injectable()
export class VesTitlebarWindowControlsContribution extends AbstractViewContribution<VesTitlebarWindowControlsWidget> {

    constructor() {
        super({
            widgetId: VesTitlebarWindowControlsWidget.ID,
            widgetName: VesTitlebarWindowControlsWidget.LABEL,
            defaultWidgetOptions: { area: 'top' }
        });
    }

    @postConstruct()
    protected async init(): Promise<void> {
        await this.openView({ activate: true, reveal: true });
    }
}
