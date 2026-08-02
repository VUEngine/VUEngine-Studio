import { ConnectionHandler, RpcConnectionHandler } from '@theia/core';
import { BackendApplicationContribution } from '@theia/core/lib/node';
import { ContainerModule } from '@theia/core/shared/inversify';
import { VES_IMAGES_SERVICE_PATH, VesImagesConverter } from '../common/ves-images-service-protocol';
import { VesImagesConverterServer } from './ves-images-converter-server';

export default new ContainerModule(bind => {
    bind(VesImagesConverterServer).toSelf().inSingletonScope();
    bind(VesImagesConverter).toService(VesImagesConverterServer);
    bind(BackendApplicationContribution).toService(VesImagesConverterServer);
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new RpcConnectionHandler(VES_IMAGES_SERVICE_PATH, () =>
            ctx.container.get<VesImagesConverter>(VesImagesConverter)
        )
    ).inSingletonScope();
});
