import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { Device, getDeviceList, on } from 'usb';
import { ConnectedFlashCart, FlashCartConfig } from '../browser/ves-flash-cart-types';
import { VesFlashCartUsbService, VesFlashCartUsbServiceClient } from '../common/ves-flash-cart-usb-service-protocol';

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
        const self = this;
        on('attach', async () => self.client?.onDidAttachDevice());
        on('detach', async () => self.client?.onDidDetachDevice());
    }

    async detectFlashCarts(...flashCartConfigs: FlashCartConfig[]): Promise<ConnectedFlashCart[]> {
        const connectedFlashCarts = [];
        const devices: Device[] = getDeviceList();
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
                if (
                    !deviceIsFlashCart &&
                    deviceDesc.idVendor === flashCartConfig.vid &&
                    deviceDesc.idProduct === flashCartConfig.pid
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
                        (flashCartConfig.manufacturer === '' ||
                            manufacturer?.includes(flashCartConfig.manufacturer)) &&
                        (flashCartConfig.product === '' ||
                            product?.includes(flashCartConfig.product))
                    ) {
                        deviceIsFlashCart = true;
                        connectedFlashCarts.push({
                            config: flashCartConfig,
                            device: device,
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

        return connectedFlashCarts;
    }
}
