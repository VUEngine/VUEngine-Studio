import { JsonRpcServer } from '@theia/core';
import { HapticBuiltInEffect, HapticFrequency, HapticLibrary } from './ves-rumble-pack-types';

export const VES_RUMBLE_PACK_USB_SERVICE_PATH = '/ves/services/rumblePack/usb';
export const VesRumblePackUsbService = Symbol('VesRumblePackUsbService');

export interface VesRumblePackUsbServiceClient {
    onDidAttachDevice(): void;
    onDidDetachDevice(): void;
    onDidReceiveData(data: string): void;
}

export interface VesRumblePackUsbService extends JsonRpcServer<VesRumblePackUsbServiceClient> {
    detectRumblePack(): Promise<boolean>;
    sendCommand(command: string): boolean;
    sendCommandPrintMenu(): boolean;
    sendCommandTriggerSingleHaptic(
        library: HapticLibrary,
        effect: HapticBuiltInEffect,
        frequency: HapticFrequency
    ): boolean;
}
