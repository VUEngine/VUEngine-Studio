import { RpcServer } from '@theia/core';
import { ConnectedFlashCart, FlashCartConfig } from './ves-flash-cart-types';

export const VES_FLASH_CART_USB_SERVICE_PATH = '/ves/services/flashCarts/usb';
export const VesFlashCartUsbService = Symbol('VesFlashCartUsbService');

export interface VesFlashCartUsbServiceClient {
    onDidAttachDevice(): void;
    onDidDetachDevice(): void;
}

export interface VesFlashCartUsbService extends RpcServer<VesFlashCartUsbServiceClient> {
    detectFlashCarts(...flashCartConfigs: FlashCartConfig[]): Promise<ConnectedFlashCart[]>;
}
