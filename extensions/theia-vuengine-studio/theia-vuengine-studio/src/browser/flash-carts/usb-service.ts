import { interfaces } from "inversify";
import { VesUsbService, workspacePath } from "../../common/usb-service-protocol";
import { WebSocketConnectionProvider } from "@theia/core/lib/browser";

export function bindVesUsbService(bind: interfaces.Bind): void {
    bind(VesUsbService).toDynamicValue(ctx => {
        const provider = ctx.container.get(WebSocketConnectionProvider);
        return provider.createProxy<VesUsbService>(workspacePath);
    }).inSingletonScope();
};
