import { ContainerModule } from '@theia/core/shared/inversify';

import { CommandContribution } from '@theia/core';
import { bindViewContribution, FrontendApplicationContribution, KeybindingContribution, WebSocketConnectionProvider, WidgetFactory } from '@theia/core/lib/browser';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';

import { VesFlashCartUsbService, VES_FLASH_CART_USB_SERVICE_PATH } from '../common/ves-flash-cart-usb-service-protocol';
import { VesFlashCartUsbWatcher } from './ves-flash-cart-usb-watcher';
import { VesFlashCartContribution } from './ves-flash-cart-contribution';
import { VesFlashCartService } from './ves-flash-cart-service';
import { VesFlashCartViewContribution } from './ves-flash-cart-view';
import { VesFlashCartWidget } from './ves-flash-cart-widget';

import '../../src/browser/style/index.css';
import { VesFlashCartStatusBarContribution } from './ves-flash-cart-statusbar-contribution';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // commands and menus
    bind(VesFlashCartContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesFlashCartContribution);
    bind(KeybindingContribution).toService(VesFlashCartContribution);
    // bind(MenuContribution).toService(VesFlashCartContribution);

    // status bar entry
    bind(VesFlashCartStatusBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesFlashCartStatusBarContribution);

    // flash cart service
    bind(VesFlashCartService).toSelf().inSingletonScope();

    // flash cart usb service
    bind(VesFlashCartUsbService).toDynamicValue(ctx => {
        const provider = ctx.container.get(WebSocketConnectionProvider);
        return provider.createProxy<VesFlashCartUsbService>(VES_FLASH_CART_USB_SERVICE_PATH);
    }).inSingletonScope();

    // flash cart usb watcher
    bind(VesFlashCartUsbWatcher).toSelf().inSingletonScope();

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
});
