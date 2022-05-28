import { WebSocketConnectionProvider } from '@theia/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import { VesGlobService, VES_GLOB_SERVICE_PATH } from '../common/ves-glob-service-protocol';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // glob service
    bind(VesGlobService).toDynamicValue(ctx => {
        const connection = ctx.container.get(WebSocketConnectionProvider);
        return connection.createProxy<VesGlobService>(VES_GLOB_SERVICE_PATH);
    }).inSingletonScope();
});
