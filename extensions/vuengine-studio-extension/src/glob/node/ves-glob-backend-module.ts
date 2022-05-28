import { ConnectionHandler, JsonRpcConnectionHandler } from '@theia/core';
import { ContainerModule } from '@theia/core/shared/inversify';
import { VesGlobService, VES_GLOB_SERVICE_PATH } from '../common/ves-glob-service-protocol';
import { VesGlobServiceImpl } from './ves-glob-service';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(VesGlobService).to(VesGlobServiceImpl).inSingletonScope();
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler(VES_GLOB_SERVICE_PATH, () =>
            ctx.container.get<VesGlobService>(VesGlobService)
        )
    ).inSingletonScope();
});
