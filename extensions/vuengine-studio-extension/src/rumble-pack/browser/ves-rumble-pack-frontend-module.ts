import { CommandContribution } from '@theia/core';
import {
    bindViewContribution,
    FrontendApplicationContribution, WebSocketConnectionProvider, WidgetFactory
} from '@theia/core/lib/browser';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { ContainerModule } from '@theia/core/shared/inversify';
import { VesRumblePackUsbService, VES_RUMBLE_PACK_USB_SERVICE_PATH } from '../common/ves-rumble-pack-usb-service-protocol';
import { VesRumblePackContribution } from './ves-rumble-pack-contribution';
import { VesRumblePackService } from './ves-rumble-pack-service';
import { VesRumblePackStatusBarContribution } from './ves-rumble-pack-statusbar-contribution';
import { VesRumblePackUsbWatcher } from './ves-rumble-pack-usb-watcher';
import { VesRumblePackViewContribution } from './ves-rumble-pack-view-contribution';
import { VesRumblePackWidget } from './ves-rumble-pack-widget';
import '../../../src/rumble-pack/browser/style/index.css';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // commands
    bind(VesRumblePackContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesRumblePackContribution);

    // status bar entry
    bind(VesRumblePackStatusBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesRumblePackStatusBarContribution);

    // rumble pack service
    bind(VesRumblePackService).toSelf().inSingletonScope();

    // rumble pack usb service
    bind(VesRumblePackUsbService).toDynamicValue(ctx => {
        const provider = ctx.container.get(WebSocketConnectionProvider);
        return provider.createProxy<VesRumblePackUsbService>(VES_RUMBLE_PACK_USB_SERVICE_PATH);
    }).inSingletonScope();

    // rumble pack view
    bindViewContribution(bind, VesRumblePackViewContribution);
    bind(FrontendApplicationContribution).toService(VesRumblePackViewContribution);
    bind(TabBarToolbarContribution).toService(VesRumblePackViewContribution);
    bind(VesRumblePackWidget).toSelf();
    bind(WidgetFactory)
        .toDynamicValue(context => ({
            id: VesRumblePackWidget.ID,
            createWidget: () =>
                context.container.get<VesRumblePackWidget>(VesRumblePackWidget),
        }))
        .inSingletonScope();

    // rumble pack usb watcher
    bind(VesRumblePackUsbWatcher).toSelf().inSingletonScope();
});
