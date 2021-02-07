import { interfaces } from "inversify";
import { WebSocketConnectionProvider } from "@theia/core/lib/browser";
import { VesFlashCartService, VES_FLASH_CART_SERVICE_PATH } from "../../../common/flash-cart-service-protocol";
import { VesFlashCartWatcher } from "./flash-cart-service-client";

export function bindVesFlashCartService(bind: interfaces.Bind): void {
    bind(VesFlashCartService).toDynamicValue(ctx => {
        const provider = ctx.container.get(WebSocketConnectionProvider);
        return provider.createProxy<VesFlashCartService>(VES_FLASH_CART_SERVICE_PATH);
    }).inSingletonScope();

    bind(VesFlashCartWatcher).toSelf();
};
