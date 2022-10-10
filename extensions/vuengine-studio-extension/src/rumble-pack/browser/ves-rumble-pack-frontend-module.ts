import { CommandContribution } from '@theia/core';
import {
    FrontendApplicationContribution, WebSocketConnectionProvider
} from '@theia/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import { VesRumblePackUsbService, VES_RUMBLE_PACK_USB_SERVICE_PATH } from '../common/ves-rumble-pack-usb-service-protocol';
import { VesRumblePackContribution } from './ves-rumble-pack-contribution';
import { VesRumblePackService } from './ves-rumble-pack-service';
import { VesRumblePackStatusBarContribution } from './ves-rumble-pack-statusbar-contribution';
import { VesRumblePackUsbWatcher } from './ves-rumble-pack-usb-watcher';

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

    // rumble pack usb watcher
    bind(VesRumblePackUsbWatcher).toSelf().inSingletonScope();
});
