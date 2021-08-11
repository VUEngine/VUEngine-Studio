import { ContainerModule } from '@theia/core/shared/inversify';
import { ConnectionHandler, JsonRpcConnectionHandler } from '@theia/core';
import { VesFlashCartUsbServiceImpl } from './ves-flash-cart-usb-service';
import { VesFlashCartUsbService, VesFlashCartUsbServiceClient, VES_FLASH_CART_USB_SERVICE_PATH } from '../common/ves-flash-cart-usb-service-protocol';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(VesFlashCartUsbServiceImpl).toSelf().inSingletonScope();
    bind(VesFlashCartUsbService).toService(VesFlashCartUsbServiceImpl);

    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler<VesFlashCartUsbServiceClient>(VES_FLASH_CART_USB_SERVICE_PATH, client => {
            const server = ctx.container.get<VesFlashCartUsbService>(VesFlashCartUsbService);
            server.setClient(client);
            return server;
        })
    ).inSingletonScope();
});
