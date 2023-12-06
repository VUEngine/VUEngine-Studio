import { ContainerModule } from '@theia/core/shared/inversify';
import { VesImagesService } from './ves-images-service';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // service
    bind(VesImagesService).toSelf().inSingletonScope();
});
