import { CommandContribution } from '@theia/core';
import { bindViewContribution, FrontendApplicationContribution, KeybindingContribution, WidgetFactory } from '@theia/core/lib/browser';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { ContainerModule } from '@theia/core/shared/inversify';
import { VesImageConverterContribution } from './ves-image-converter-contribution';
import { VesImageConverterService } from './ves-image-converter-service';
import { VesImageConverterViewContribution } from './ves-image-converter-view-contribution';
import { VesImageConverterWidget } from './ves-image-converter-widget';
import '../../../src/image-converter/browser/style/index.css';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // commands, keybindings and menus
    bind(VesImageConverterContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesImageConverterContribution);
    bind(KeybindingContribution).toService(VesImageConverterContribution);

    // service
    bind(VesImageConverterService).toSelf().inSingletonScope();

    // build view
    bindViewContribution(bind, VesImageConverterViewContribution);
    bind(FrontendApplicationContribution).toService(VesImageConverterViewContribution);
    bind(TabBarToolbarContribution).toService(VesImageConverterViewContribution);
    bind(VesImageConverterWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: VesImageConverterWidget.ID,
        createWidget: () => ctx.container.get<VesImageConverterWidget>(VesImageConverterWidget)
    })).inSingletonScope();
});
