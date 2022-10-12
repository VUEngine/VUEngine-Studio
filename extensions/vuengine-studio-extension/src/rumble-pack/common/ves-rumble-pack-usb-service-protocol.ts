import { JsonRpcServer } from '@theia/core';

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
    sendCommandPrintVersion(): boolean;
    sendCommandPlayLastEffect(): boolean;
    sendCommandStopCurrentEffect(): boolean;
    sendCommandPlayEffect(effect: number, frequency: number): boolean;
    sendCommandSetOverdrive(overdrive: number): boolean;
    sendCommandSetPositiveSustain(sustain: number): boolean;
    sendCommandSetNegativeSustain(sustain: number): boolean;
    sendCommandSetBreak(breakValue: number): boolean;
    sendCommandEmulateVbByte(byte: string): boolean;
}
