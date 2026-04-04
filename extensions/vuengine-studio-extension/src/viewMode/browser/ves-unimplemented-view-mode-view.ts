import { AbstractViewContribution } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { UnimplementedViewModeWidget } from './ves-unimplemented-view-mode-widget';

@injectable()
export class UnimplementedViewModeViewContribution extends AbstractViewContribution<UnimplementedViewModeWidget> {
    constructor() {
        super({
            widgetId: UnimplementedViewModeWidget.ID,
            widgetName: UnimplementedViewModeWidget.LABEL,
            defaultWidgetOptions: {
                area: 'main',
            },
        });
    }
}
