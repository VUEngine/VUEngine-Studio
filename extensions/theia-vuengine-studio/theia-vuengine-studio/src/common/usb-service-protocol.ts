import { Event } from "@theia/core";
import { Device } from "usb";
export const workspacePath = '/services/ves/usb';
import { FlashCartConfig } from "../browser/flash-carts/commands/flash";

export const VesUsbService = Symbol('VesUsbService');
export interface VesUsbService {
    detectFlashCart(...flashCartConfigs: FlashCartConfig[]): Promise<FlashCartConfig | undefined>;
    onDeviceConnected: Event<Device>;
    onDeviceDisconnected: Event<Device>;
}
