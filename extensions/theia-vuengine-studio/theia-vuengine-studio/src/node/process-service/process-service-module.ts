import { interfaces } from 'inversify';
import { ConnectionHandler, JsonRpcConnectionHandler } from '@theia/core';
import { DefaultVesProcessService } from './default-process-service';
import { VesProcessService, workspacePath } from '../../common/process-service-protocol';

export function bindVesProcessService(bind: interfaces.Bind): void {
    bind(DefaultVesProcessService).toSelf().inSingletonScope();
    bind(VesProcessService).toService(DefaultVesProcessService);

    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler(workspacePath, () => {
            return ctx.container.get(VesProcessService);
        })
    ).inSingletonScope()
}