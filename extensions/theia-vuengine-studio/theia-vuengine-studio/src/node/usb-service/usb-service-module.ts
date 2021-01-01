import { interfaces } from 'inversify';
import { ConnectionHandler, JsonRpcConnectionHandler } from '@theia/core';
import { DefaultVesUsbService } from './default-usb-service';
import { VesUsbService, workspacePath } from '../../common/usb-service-protocol';

export function bindVesUsbService(bind: interfaces.Bind): void {
    bind(DefaultVesUsbService).toSelf().inSingletonScope();
    bind(VesUsbService).toService(DefaultVesUsbService);

    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler(workspacePath, () => {
            return ctx.container.get(VesUsbService);
        })
    ).inSingletonScope()
}