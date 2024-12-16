import { ViewContainer } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { NavigatorWidgetFactory } from '@theia/navigator/lib/browser/navigator-widget-factory';

@injectable()
export class VesNavigatorWidgetFactory extends NavigatorWidgetFactory {
    // initially hide "open editors" tab of navigator
    protected openEditorsWidgetOptions: ViewContainer.Factory.WidgetOptions = {
        order: 0,
        canHide: true,
        initiallyCollapsed: true,
        weight: 20,
        initiallyHidden: true,
    };
}
