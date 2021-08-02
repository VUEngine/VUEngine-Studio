import { ContainerModule } from '@theia/core/shared/inversify';
import { ConnectionHandler, JsonRpcConnectionHandler } from '@theia/core';

import { VesProcessServiceImpl } from './ves-process-service';
import { VesProcessService, VesProcessServiceClient, VES_PROCESS_SERVICE_PATH } from '../common/ves-process-service-protocol';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(VesProcessServiceImpl).toSelf().inSingletonScope();
    bind(VesProcessService).toService(VesProcessServiceImpl);

    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler<VesProcessServiceClient>(VES_PROCESS_SERVICE_PATH, client => {
            const server = ctx.container.get<VesProcessService>(VesProcessService);
            server.setClient(client);
            return server;
        })
    ).inSingletonScope();
});
