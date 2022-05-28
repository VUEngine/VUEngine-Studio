import { JsonRpcServer } from '@theia/core';
import { HapticFrequency } from './ves-rumble-pack-types';

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
    sendCommandPrintVbCommandLineState(): boolean;
    sendCommandPrintVbSyncLineState(): boolean;
    sendCommandPlayLastEffect(): boolean;
    sendCommandStopCurrentEffect(): boolean;
    sendCommandPlayEffect(effect: string): boolean;
    sendCommandSetFrequency(frequency: HapticFrequency): boolean;
    sendCommandSetOverdrive(overdrive: number): boolean;
    sendCommandSetPositiveSustain(sustain: number): boolean;
    sendCommandSetNegativeSustain(sustain: number): boolean;
    sendCommandSetBreak(breakValue: number): boolean;
    sendCommandEmulateVbByte(byte: string): boolean;
}
