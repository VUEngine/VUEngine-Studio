import { ContainerModule } from '@theia/core/shared/inversify';
import { ConnectionHandler, RpcConnectionHandler } from '@theia/core';
import { VesSocketServiceImpl } from './ves-socket-service';
import { VesSocketService, VesSocketServiceClient, VES_SOCKET_SERVICE_PATH } from '../common/ves-socket-service-protocol';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(VesSocketServiceImpl).toSelf().inSingletonScope();
    bind(VesSocketService).toService(VesSocketServiceImpl);
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler<VesSocketServiceClient>(VES_SOCKET_SERVICE_PATH, client => {
            const server = ctx.container.get<VesSocketService>(VesSocketService);
            server.setClient(client);
            return server;
        })
    ).inSingletonScope();
});
