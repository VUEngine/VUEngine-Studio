import { RemoteConnectionProvider, ServiceConnectionProvider } from '@theia/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import { VES_PROCESS_SERVICE_PATH, VesProcessService } from '../common/ves-process-service-protocol';
import { VesProcessWatcher } from './ves-process-service-watcher';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
  bind(VesProcessService).toDynamicValue(ctx => {
    const connection = ctx.container.get<ServiceConnectionProvider>(RemoteConnectionProvider);
    return connection.createProxy<VesProcessService>(VES_PROCESS_SERVICE_PATH);
  }).inSingletonScope();

  bind(VesProcessWatcher).toSelf().inSingletonScope();
});
