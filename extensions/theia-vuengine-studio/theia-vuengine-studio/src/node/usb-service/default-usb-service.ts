import { injectable, postConstruct } from "inversify";
import { Device, getDeviceList, on } from "usb";
import { Emitter, Event } from "@theia/core";
import { ConnectedFlashCart, FlashCartConfig } from "../../browser/flash-carts/commands/flash";
import { VesUsbService } from "../../common/usb-service-protocol";

@injectable()
export class DefaultVesUsbService implements VesUsbService {
    protected readonly onDeviceConnectedEmitter = new Emitter<Device>();
    readonly onDeviceConnected: Event<Device> = this.onDeviceConnectedEmitter.event;
    protected readonly onDeviceDisconnectedEmitter = new Emitter<Device>();
    readonly onDeviceDisconnected: Event<Device> = this.onDeviceDisconnectedEmitter.event;

    @postConstruct()
    protected init(): void {
        const self = this;
        on('attach', async function (device) {
            console.log('attach');
            self.onDeviceConnectedEmitter.fire(device);
        });
        on('detach', function (device) {
            console.log('detach');
            self.onDeviceDisconnectedEmitter.fire(device);
        });
    }

    async detectFlashCart(...flashCartConfigs: FlashCartConfig[]): Promise<ConnectedFlashCart | undefined> {
        const devices: Device[] = getDeviceList();
        let manufacturer: string | undefined;
        let product: string | undefined;
        for (const flashCartConfig of flashCartConfigs) {
            for (let i = 0; i < devices.length; i++) {
                const deviceDesc = devices[i].deviceDescriptor;
                if (
                    deviceDesc.idVendor == flashCartConfig.vid &&
                    deviceDesc.idProduct == flashCartConfig.pid
                ) {
                    devices[i].open();
                    manufacturer = await new Promise((resolve, reject) => {
                        devices[i].getStringDescriptor(
                            devices[i].deviceDescriptor.iManufacturer,
                            (error, data) => {
                                resolve(data);
                            }
                        );
                    });
                    product = await new Promise((resolve, reject) => {
                        devices[i].getStringDescriptor(
                            devices[i].deviceDescriptor.iProduct,
                            (error, data) => {
                                resolve(data);
                            }
                        );
                    });
                    devices[i].close();

                    if (
                        (flashCartConfig.manufacturer === "" ||
                            manufacturer?.includes(flashCartConfig.manufacturer)) &&
                        (flashCartConfig.product === "" ||
                            product?.includes(flashCartConfig.product))
                    ) {
                        return {
                            config: flashCartConfig,
                            device: devices[i],
                        }
                    }
                }
            }
        }

        return;
    }
}