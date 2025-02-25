import { RemoteConnectionProvider, ServiceConnectionProvider } from '@theia/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import { VES_SOCKET_SERVICE_PATH, VesSocketService } from '../common/ves-socket-service-protocol';
import { VesSocketWatcher } from './ves-socket-service-watcher';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
  bind(VesSocketService).toDynamicValue(ctx => {
    const connection = ctx.container.get<ServiceConnectionProvider>(RemoteConnectionProvider);
    return connection.createProxy<VesSocketService>(VES_SOCKET_SERVICE_PATH);
  }).inSingletonScope();

  bind(VesSocketWatcher).toSelf().inSingletonScope();
});
