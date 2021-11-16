import { JsonRpcServer } from '@theia/core';
import { ConnectedFlashCart, FlashCartConfig } from '../browser/ves-flash-cart-types';

export const VES_FLASH_CART_USB_SERVICE_PATH = '/ves/services/flashCarts/usb';
export const VesFlashCartUsbService = Symbol('VesFlashCartUsbService');

export interface VesFlashCartUsbServiceClient {
    onDidAttachDevice(): void;
    onDidDetachDevice(): void;
}

export interface VesFlashCartUsbService extends JsonRpcServer<VesFlashCartUsbServiceClient> {
    detectFlashCarts(...flashCartConfigs: FlashCartConfig[]): Promise<ConnectedFlashCart[]>;
}
