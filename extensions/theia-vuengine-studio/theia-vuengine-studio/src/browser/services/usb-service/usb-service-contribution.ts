import { interfaces } from "inversify";
import { WebSocketConnectionProvider } from "@theia/core/lib/browser";
import { VesUsbService, VES_USB_SERVICE_PATH } from "../../../common/usb-service-protocol";
import { VesUsbServiceClient } from "./usb-service-client";

export function bindVesUsbService(bind: interfaces.Bind): void {
    bind(VesUsbService).toDynamicValue(ctx => {
        const provider = ctx.container.get(WebSocketConnectionProvider);
        return provider.createProxy<VesUsbService>(VES_USB_SERVICE_PATH);
    }).inSingletonScope();

    // bind(CommandContribution).to(UsbServiceContribution);

    bind(VesUsbServiceClient).toSelf();
};
