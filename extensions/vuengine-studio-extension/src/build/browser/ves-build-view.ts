import { injectable } from '@theia/core/shared/inversify';
import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { VesBuildWidget } from './ves-build-widget';

@injectable()
export class VesBuildViewContribution extends AbstractViewContribution<VesBuildWidget> {
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
