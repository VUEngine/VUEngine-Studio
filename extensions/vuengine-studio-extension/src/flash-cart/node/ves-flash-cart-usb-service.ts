import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { usb, getDeviceList } from 'usb';
import { ConnectedFlashCart, FlashCartConfig } from '../common/ves-flash-cart-types';
import { VesFlashCartUsbService, VesFlashCartUsbServiceClient } from '../common/ves-flash-cart-usb-service-protocol';
import { SerialPort } from 'serialport';

@injectable()
export class VesFlashCartUsbServiceImpl implements VesFlashCartUsbService {
    protected client: VesFlashCartUsbServiceClient | undefined;

    dispose(): void {
        throw new Error('Method not implemented.');
    }

    async setClient(client: VesFlashCartUsbServiceClient): Promise<void> {
        this.client = client;
    }

    @postConstruct()
    protected init(): void {
        usb.on('attach', async () => this.client?.onDidAttachDevice());
        usb.on('detach', async () => this.client?.onDidDetachDevice());
    }

    async detectFlashCarts(...flashCartConfigs: FlashCartConfig[]): Promise<ConnectedFlashCart[]> {
        const connectedFlashCarts = [];
        const devices: usb.Device[] = getDeviceList();
        const ports = await SerialPort.list();
        let manufacturer: string | undefined;
        let product: string | undefined;
        let deviceIsFlashCart = false;
        // For every connected USB device, check if it is one of the configured flash carts.
        // This way...
        // 1) multiple carts of the same type can be used
        // 2) the same device cannot be detected for two different configurations with the same
        //    vid, hid, etc, because we continue to the next device when we match a config
        for (const device of devices) {
            deviceIsFlashCart = false;
            for (const flashCartConfig of flashCartConfigs) {
                const deviceDesc = device.deviceDescriptor;
                for (const deviceCodes of flashCartConfig.deviceCodes) {
                    if (
                        !deviceIsFlashCart &&
                        deviceDesc.idVendor === deviceCodes.vid &&
                        deviceDesc.idProduct === deviceCodes.pid
                    ) {
                        device.open();
                        manufacturer = await new Promise((resolve, reject) => {
                            device.getStringDescriptor(
                                device.deviceDescriptor.iManufacturer,
                                (error, data) => resolve(data)
                            );
                        });
                        product = await new Promise((resolve, reject) => {
                            device.getStringDescriptor(
                                device.deviceDescriptor.iProduct,
                                (error, data) => resolve(data)
                            );
                        });
                        device.close();

                        if (
                            (deviceCodes.manufacturer === '' ||
                                manufacturer?.includes(deviceCodes.manufacturer)) &&
                            (deviceCodes.product === '' ||
                                product?.includes(deviceCodes.product))
                        ) {
                            const portName = ports.find(port =>
                                parseInt(port.productId || '0', 16) === deviceCodes.pid &&
                                parseInt(port.vendorId || '0', 16) === deviceCodes.vid &&
                                port.manufacturer === deviceCodes.manufacturer);

                            deviceIsFlashCart = true;
                            connectedFlashCarts.push({
                                config: flashCartConfig,
                                deviceCodes,
                                port: portName?.path || '',
                                status: {
                                    processId: -1,
                                    step: '',
                                    progress: -1,
                                    log: [],
                                },
                                canHoldRom: true,
                            });
                        }
                    }
                }
            }
        }

        return connectedFlashCarts;
    }
}
