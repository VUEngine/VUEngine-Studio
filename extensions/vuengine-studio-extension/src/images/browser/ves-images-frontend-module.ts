import { RemoteConnectionProvider, ServiceConnectionProvider } from '@theia/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import { VES_IMAGES_SERVICE_PATH, VesImagesConverter } from '../common/ves-images-service-protocol';
import { VesImagesService } from './ves-images-service';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(VesImagesService).toSelf().inSingletonScope();

    bind(VesImagesConverter).toDynamicValue(ctx => {
        const connection = ctx.container.get<ServiceConnectionProvider>(RemoteConnectionProvider);
        return connection.createProxy<VesImagesConverter>(VES_IMAGES_SERVICE_PATH);
    }).inSingletonScope();
});
