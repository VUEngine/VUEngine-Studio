import { ContainerModule } from '@theia/core/shared/inversify';
import { CommandContribution, MenuContribution } from '@theia/core';
import {
    bindViewContribution,
    FrontendApplicationContribution,
    KeybindingContribution,
    PreferenceContribution,
    WidgetFactory
} from '@theia/core/lib/browser';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { VesFlashCartContribution } from './ves-flash-cart-contribution';
import { VesFlashCartService } from './ves-flash-cart-service';
import { VesFlashCartViewContribution } from './ves-flash-cart-view-contribution';
import { VesFlashCartWidget } from './ves-flash-cart-widget';
import { VesFlashCartStatusBarContribution } from './ves-flash-cart-statusbar-contribution';
import { VesFlashCartPreferenceSchema } from './ves-flash-cart-preferences';
import { TabBarDecorator } from '@theia/core/lib/browser/shell/tab-bar-decorator';
import { VesFlashCartTabBarDecorator } from './ves-flash-cart-tab-bar-decorator';
import '../../../src/flash-cart/browser/style/index.css';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // preferences
    bind(PreferenceContribution).toConstantValue({ schema: VesFlashCartPreferenceSchema });

    // commands and menus
    bind(VesFlashCartContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesFlashCartContribution);
    bind(KeybindingContribution).toService(VesFlashCartContribution);
    bind(MenuContribution).toService(VesFlashCartContribution);

    // status bar entry
    bind(VesFlashCartStatusBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesFlashCartStatusBarContribution);

    // flash cart service
    bind(VesFlashCartService).toSelf().inSingletonScope();

    // flash cart view
    bindViewContribution(bind, VesFlashCartViewContribution);
    bind(FrontendApplicationContribution).toService(VesFlashCartViewContribution);
    bind(TabBarToolbarContribution).toService(VesFlashCartViewContribution);
    bind(VesFlashCartWidget).toSelf();
    bind(WidgetFactory)
        .toDynamicValue(context => ({
            id: VesFlashCartWidget.ID,
            createWidget: () =>
                context.container.get<VesFlashCartWidget>(VesFlashCartWidget),
        }))
        .inSingletonScope();

    // tab bar decorator
    bind(VesFlashCartTabBarDecorator).toSelf().inSingletonScope();
    bind(TabBarDecorator).toService(VesFlashCartTabBarDecorator);
});
