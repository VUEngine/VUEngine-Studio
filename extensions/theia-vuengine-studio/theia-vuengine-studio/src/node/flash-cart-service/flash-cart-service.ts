import { injectable, postConstruct } from "inversify";
import { Device, getDeviceList, on } from "usb";
import { ConnectedFlashCart, FlashCartConfig } from "../../browser/flash-carts/commands/flash";
import { VesFlashCartService, VesFlashCartServiceClient } from "../../common/flash-cart-service-protocol";

@injectable()
export class VesFlashCartServiceImpl implements VesFlashCartService {
    protected client: VesFlashCartServiceClient | undefined;

    dispose(): void {
        throw new Error("Method not implemented.");
    }

    async setClient(client: VesFlashCartServiceClient) {
        this.client = client;
    }

    @postConstruct()
    protected init(): void {
        const self = this;
        on("attach", async (device) => self.client?.onAttach());
        on("detach", async (device) => self.client?.onDetach());
    }

    async detectFlashCarts(...flashCartConfigs: FlashCartConfig[]): Promise<ConnectedFlashCart[]> {
        const connectedFlashCarts = [];
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
                        connectedFlashCarts.push({
                            config: flashCartConfig,
                            device: devices[i],
                            status: {
                                processId: 0,
                                step: "",
                                progress: -1,
                            },
                        })
                    }
                }
            }
        }

        return connectedFlashCarts;
    }
}