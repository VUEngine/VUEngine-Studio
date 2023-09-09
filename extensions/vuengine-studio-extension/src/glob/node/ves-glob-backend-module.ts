import { ConnectionHandler, RpcConnectionHandler } from '@theia/core';
import { ContainerModule } from '@theia/core/shared/inversify';
import { VesGlobService, VES_GLOB_SERVICE_PATH } from '../common/ves-glob-service-protocol';
import { VesGlobServiceImpl } from './ves-glob-service';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(VesGlobServiceImpl).toSelf().inSingletonScope();
    bind(VesGlobService).toService(VesGlobServiceImpl);
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(VES_GLOB_SERVICE_PATH, () =>
            ctx.container.get<VesGlobService>(VesGlobService)
        )
    ).inSingletonScope();
});
