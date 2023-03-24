import {
    bindViewContribution,
    FrontendApplicationContribution, WidgetFactory
} from '@theia/core/lib/browser';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { ContainerModule } from '@theia/core/shared/inversify';
import { Ves3dConverterViewContribution } from './ves-3d-converter-view-contribution';
import { Ves3dConverterWidget } from './ves-3d-converter-widget';
import '../../../src/3d-converter/browser/style/index.css';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // 3D Converter view
    bindViewContribution(bind, Ves3dConverterViewContribution);
    bind(FrontendApplicationContribution).toService(Ves3dConverterViewContribution);
    bind(TabBarToolbarContribution).toService(Ves3dConverterViewContribution);
    bind(Ves3dConverterWidget).toSelf();
    bind(WidgetFactory)
        .toDynamicValue(context => ({
            id: Ves3dConverterWidget.ID,
            createWidget: () =>
                context.container.get<Ves3dConverterWidget>(Ves3dConverterWidget),
        }))
        .inSingletonScope();
});
