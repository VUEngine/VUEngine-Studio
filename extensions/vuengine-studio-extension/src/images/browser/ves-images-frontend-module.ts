import { CommandContribution } from '@theia/core';
import { bindViewContribution, FrontendApplicationContribution, KeybindingContribution, WidgetFactory } from '@theia/core/lib/browser';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { ContainerModule } from '@theia/core/shared/inversify';
import { VesImagesContribution } from './ves-images-contribution';
import { VesImagesService } from './ves-images-service';
import { VesImagesViewContribution } from './ves-images-view-contribution';
import { VesImagesWidget } from './ves-images-widget';
import '../../../src/images/browser/style/index.css';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // commands, keybindings and menus
    bind(VesImagesContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesImagesContribution);
    bind(KeybindingContribution).toService(VesImagesContribution);

    // service
    bind(VesImagesService).toSelf().inSingletonScope();

    // build view
    bindViewContribution(bind, VesImagesViewContribution);
    bind(FrontendApplicationContribution).toService(VesImagesViewContribution);
    bind(TabBarToolbarContribution).toService(VesImagesViewContribution);
    bind(VesImagesWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: VesImagesWidget.ID,
        createWidget: () => ctx.container.get<VesImagesWidget>(VesImagesWidget)
    })).inSingletonScope();
});
