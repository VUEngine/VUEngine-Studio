import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { SerialPort } from 'serialport';
import { usb } from 'usb';
import { HapticBuiltInEffect, HapticFrequency, RUMBLE_PACK_IDS } from '../common/ves-rumble-pack-types';
import { VesRumblePackUsbService, VesRumblePackUsbServiceClient } from '../common/ves-rumble-pack-usb-service-protocol';

@injectable()
export class VesRumblePackUsbServiceImpl implements VesRumblePackUsbService {
    protected client: VesRumblePackUsbServiceClient | undefined;
    protected port: SerialPort | undefined;

    dispose(): void {
        throw new Error('Method not implemented.');
    }

    async setClient(client: VesRumblePackUsbServiceClient): Promise<void> {
        this.client = client;
    }

    @postConstruct()
    protected init(): void {
        usb.on('attach', async () => this.client?.onDidAttachDevice());
        usb.on('detach', async () => this.client?.onDidDetachDevice());
    }

    async detectRumblePack(): Promise<boolean> {
        let connectedRumblePack = false;

        const ports = await SerialPort.list();
        ports.map(port =>
            RUMBLE_PACK_IDS.map(rumblePackId => {
                if (port.productId === rumblePackId.productId &&
                    port.vendorId === rumblePackId.vendoriId &&
                    port.manufacturer === rumblePackId.manufacturer) {
                    connectedRumblePack = true;
                    this.port = new SerialPort({
                        path: port.path,
                        baudRate: 115200,
                        dataBits: 8,
                        stopBits: 1,
                        parity: 'none',
                    });
                    this.port.on('data', data => this.client?.onDidReceiveData(data.toString()));
                }
            })
        );

        if (!connectedRumblePack) {
            this.port = undefined;
        }

        return connectedRumblePack;
    }

    sendCommand(command: string): boolean {
        return this.port?.write(`<${command}>`) || false;
    }

    sendCommandPrintMenu(): boolean {
        return this.sendCommand('PM');
    }

    sendCommandPrintVbCommandLineState(): boolean {
        return this.sendCommand('VBC');
    }

    sendCommandPrintVbSyncLineState(): boolean {
        return this.sendCommand('VBS');
    }

    sendCommandPlayLastEffect(): boolean {
        return this.sendCommand('GO');
    }

    sendCommandStopCurrentEffect(): boolean {
        return this.sendCommand('STP');
    }

    sendCommandPlayEffect(effect: HapticBuiltInEffect): boolean {
        return this.sendCommand(`HAP ${effect}`);
    }

    sendCommandSetFrequency(frequency: HapticFrequency): boolean {
        return this.sendCommand(`FRQ ${frequency}`);
    }

    sendCommandSetOverdrive(overdrive: number): boolean {
        return this.sendCommand(`ODT ${overdrive.toString().padStart(3, '0')}`);
    }

    sendCommandSetPositiveSustain(sustain: number): boolean {
        return this.sendCommand(`SPT ${sustain.toString().padStart(3, '0')}`);
    }

    sendCommandSetNegativeSustain(sustain: number): boolean {
        return this.sendCommand(`SNT ${sustain.toString().padStart(3, '0')}`);
    }

    sendCommandSetBreak(breakValue: number): boolean {
        return this.sendCommand(`BRT ${breakValue.toString().padStart(3, '0')}`);
    }

    sendCommandEmulateVbByte(byte: string): boolean {
        return this.sendCommand(`VB ${byte}`);
    }
}
