import { JsonRpcServer } from "@theia/core";
import { ConnectedFlashCart, FlashCartConfig } from "../browser/flash-carts/commands/flash";

export const VES_FLASH_CART_SERVICE_PATH = "/ves/services/flashCarts";
export const VesFlashCartService = Symbol("VesFlashCartService");

export interface VesFlashCartServiceClient {
    onAttach(): void;
    onDetach(): void;
}

export interface VesFlashCartService extends JsonRpcServer<VesFlashCartServiceClient> {
    detectFlashCart(...flashCartConfigs: FlashCartConfig[]): Promise<ConnectedFlashCart | undefined>;
}