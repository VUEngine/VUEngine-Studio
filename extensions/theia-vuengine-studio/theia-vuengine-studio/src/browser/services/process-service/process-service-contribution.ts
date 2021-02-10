import { interfaces } from "inversify";
import { VesProcessService, VES_PROCESS_SERVICE_PATH } from "../../../common/process-service-protocol";
import { WebSocketConnectionProvider } from "@theia/core/lib/browser";
import { VesProcessWatcher } from "./process-watcher";

export function bindVesProcessService(bind: interfaces.Bind): void {
    bind(VesProcessService).toDynamicValue(ctx => {
        const provider = ctx.container.get(WebSocketConnectionProvider);
        return provider.createProxy<VesProcessService>(VES_PROCESS_SERVICE_PATH);
    }).inSingletonScope();

    bind(VesProcessWatcher).toSelf().inSingletonScope();
};
