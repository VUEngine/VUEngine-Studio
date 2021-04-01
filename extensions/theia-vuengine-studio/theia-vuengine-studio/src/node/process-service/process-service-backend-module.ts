import { interfaces } from 'inversify';
import { ConnectionHandler, JsonRpcConnectionHandler } from '@theia/core';
import { VesProcessService, VesProcessServiceClient, VES_PROCESS_SERVICE_PATH } from '../../common/process-service-protocol';
import { VesProcessServiceImpl } from './process-service';

export function bindVesProcessService(bind: interfaces.Bind): void {
    bind(VesProcessServiceImpl).toSelf().inSingletonScope();
    bind(VesProcessService).toService(VesProcessServiceImpl);

    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler<VesProcessServiceClient>(VES_PROCESS_SERVICE_PATH, client => {
            const server = ctx.container.get<VesProcessService>(VesProcessService);
            server.setClient(client);
            return server;
        })
    ).inSingletonScope();
}