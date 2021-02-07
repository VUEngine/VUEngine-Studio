import { JsonRpcServer } from "@theia/core";
import { ConnectedFlashCart } from "../browser/flash-carts/commands/flash";

export const VES_USB_SERVICE_PATH = "/ves/services/usb";
export const VesUsbService = Symbol("VesUsbService");

export interface VesUsbServiceClient {
    onAttach(connectedFlashCart: ConnectedFlashCart | undefined): void;
    onDetach(connectedFlashCart: ConnectedFlashCart | undefined): void;
}

export interface VesUsbService extends JsonRpcServer<VesUsbServiceClient> {
    detectFlashCart(): Promise<ConnectedFlashCart | undefined>;
}