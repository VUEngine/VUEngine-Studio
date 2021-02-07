import { /*inject, */injectable, postConstruct } from "inversify";
import { isOSX, isWindows } from "@theia/core";
import { join as joinPath } from "path";
import { Device, getDeviceList, on } from "usb";
import { getOs, getResourcesPath } from "../../browser/common/functions";
import { ConnectedFlashCart, FlashCartConfig } from "../../browser/flash-carts/commands/flash";
// import { VesFlashCartsCustomPreference } from "../../browser/flash-carts/preferences";
import { VesUsbService, VesUsbServiceClient } from "../../common/usb-service-protocol";
// import { PreferenceService } from "@theia/core/lib/browser";

@injectable()
export class VesUsbServiceImpl implements VesUsbService {
    // @inject(PreferenceService) private readonly preferenceService: PreferenceService;
    protected client: VesUsbServiceClient | undefined;

    dispose(): void {
        throw new Error("Method not implemented.");
    }

    async setClient(client: VesUsbServiceClient) {
        this.client = client;
    }

    @postConstruct()
    protected async init(): Promise<void> {
        const self = this;
        on("attach", async (device) => self.client?.onAttach(await this.detectFlashCart()));
        on("detach", async (device) => self.client?.onDetach(await this.detectFlashCart()));
    }

    protected getFlashCartConfigs(): FlashCartConfig[] {
        const flashCartConfigs = [
            {
                name: "FlashBoy (Plus)",
                vid: 6017,
                pid: 2466,
                manufacturer: "Richard Hutchinson",
                product: "FlashBoy",
                size: 16,
                path: joinPath(
                    getResourcesPath(),
                    "binaries",
                    "vuengine-studio-tools",
                    getOs(),
                    "prog-vb",
                    isWindows ? "prog-vb.exe" : "prog-vb"
                ),
                args: "%ROM%",
                padRom: true,
            },
            {
                name: "HyperFlash32",
                vid: 1027,
                pid: 24577,
                manufacturer: "FTDI",
                product: "FT232R",
                size: 32,
                path: joinPath(
                    getResourcesPath(),
                    "binaries",
                    "vuengine-studio-tools",
                    getOs(),
                    "hf-cli",
                    isWindows ? "hfcli.exe" : "hfcli"
                ),
                args: isOSX
                    ? `-p %PORT% -s %ROM% -u --slow`
                    : `-p %PORT% -s %ROM% -u`,
                padRom: false,
            },
        ];

        // const userDefinedFlashCartConfigs: FlashCartConfig[] | undefined =
        //     this.preferenceService.get(VesFlashCartsCustomPreference.id) ?? [];

        // return [...flashCartConfigs, ...userDefinedFlashCartConfigs];
        return flashCartConfigs;
    }

    async detectFlashCart(): Promise<ConnectedFlashCart | undefined> {
        const flashCartConfigs = this.getFlashCartConfigs();
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