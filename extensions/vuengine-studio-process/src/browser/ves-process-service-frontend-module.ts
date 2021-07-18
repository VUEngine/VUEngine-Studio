import { ContainerModule } from 'inversify';
import { WebSocketConnectionProvider } from '@theia/core/lib/browser';

import { VesProcessService, VES_PROCESS_SERVICE_PATH } from '../common/ves-process-service-protocol';
import { VesProcessWatcher } from './ves-process-service-watcher';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
  bind(VesProcessService).toDynamicValue(ctx => {
    const provider = ctx.container.get(WebSocketConnectionProvider);
    return provider.createProxy<VesProcessService>(VES_PROCESS_SERVICE_PATH);
  }).inSingletonScope();

  bind(VesProcessWatcher).toSelf().inSingletonScope();
});
