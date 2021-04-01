import { interfaces } from 'inversify';
import { ConnectionHandler, JsonRpcConnectionHandler } from "@theia/core";
import { VesFlashCartService, VES_FLASH_CART_SERVICE_PATH, VesFlashCartServiceClient } from "../../common/flash-cart-service-protocol";
import { VesFlashCartServiceImpl } from "./flash-cart-service";

export function bindVesFlashCartService(bind: interfaces.Bind): void {
    bind(VesFlashCartServiceImpl).toSelf().inSingletonScope();
    bind(VesFlashCartService).toService(VesFlashCartServiceImpl);

    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler<VesFlashCartServiceClient>(VES_FLASH_CART_SERVICE_PATH, client => {
            const server = ctx.container.get<VesFlashCartService>(VesFlashCartService);
            server.setClient(client);
            return server;
        })
    ).inSingletonScope();
}