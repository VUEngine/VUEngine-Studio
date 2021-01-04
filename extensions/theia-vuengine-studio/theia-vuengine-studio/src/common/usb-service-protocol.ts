import { Event } from "@theia/core";
import { Device } from "usb";
export const workspacePath = '/services/ves/usb';
import { ConnectedFlashCart, FlashCartConfig } from "../browser/flash-carts/commands/flash";

export const VesUsbService = Symbol('VesUsbService');
export interface VesUsbService {
    detectFlashCart(...flashCartConfigs: FlashCartConfig[]): Promise<ConnectedFlashCart | undefined>;
    onDeviceConnected: Event<Device>;
    onDeviceDisconnected: Event<Device>;
}
