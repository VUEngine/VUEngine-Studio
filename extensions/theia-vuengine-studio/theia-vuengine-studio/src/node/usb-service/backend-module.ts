import { interfaces } from 'inversify';
import { ConnectionHandler, JsonRpcConnectionHandler } from "@theia/core";
import { VesUsbService, VES_USB_SERVICE_PATH, VesUsbServiceClient } from "../../common/usb-service-protocol";
import { VesUsbServiceImpl } from "./usb-service";

export function bindVesUsbService(bind: interfaces.Bind): void {
    bind(VesUsbServiceImpl).toSelf().inSingletonScope();
    bind(VesUsbService).toService(VesUsbServiceImpl);

    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler<VesUsbServiceClient>(VES_USB_SERVICE_PATH, client => {
            const server = ctx.container.get<VesUsbService>(VesUsbService);
            server.setClient(client);
            return server;
        })
    ).inSingletonScope();
}