import { ContainerModule } from 'inversify';
import { ConnectionHandler, JsonRpcConnectionHandler } from '@theia/core';
import { DefaultVesUsbService } from './default-usb-service';
import { VesUsbService, workspacePath } from '../common/usb-service-protocol';

export default new ContainerModule(bind => {
    bind(DefaultVesUsbService).toSelf().inSingletonScope();
    bind(VesUsbService).toService(DefaultVesUsbService);

    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler(workspacePath, () => {
            return ctx.container.get(VesUsbService);
        })
    ).inSingletonScope()
});