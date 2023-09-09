import { ContainerModule } from '@theia/core/shared/inversify';
import { ConnectionHandler, RpcConnectionHandler } from '@theia/core';
import { VesRumblePackUsbServiceImpl } from './ves-rumble-pack-usb-service';
import { VesRumblePackUsbService, VesRumblePackUsbServiceClient, VES_RUMBLE_PACK_USB_SERVICE_PATH } from '../common/ves-rumble-pack-usb-service-protocol';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(VesRumblePackUsbServiceImpl).toSelf().inSingletonScope();
    bind(VesRumblePackUsbService).toService(VesRumblePackUsbServiceImpl);
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler<VesRumblePackUsbServiceClient>(VES_RUMBLE_PACK_USB_SERVICE_PATH, client => {
            const server = ctx.container.get<VesRumblePackUsbService>(VesRumblePackUsbService);
            server.setClient(client);
            return server;
        })
    ).inSingletonScope();
});
