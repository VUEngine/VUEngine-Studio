import { interfaces } from "inversify";
import { VesProcessService, workspacePath } from "../../common/process-service-protocol";
import { WebSocketConnectionProvider } from "@theia/core/lib/browser";

export function bindVesProcessService(bind: interfaces.Bind): void {
    bind(VesProcessService).toDynamicValue(ctx => {
        const provider = ctx.container.get(WebSocketConnectionProvider);
        return provider.createProxy<VesProcessService>(workspacePath);
    }).inSingletonScope();
};
