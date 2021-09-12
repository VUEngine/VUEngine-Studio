import { ContainerModule } from '@theia/core/shared/inversify';
import { VesCodegenService } from './ves-codegen-service';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // service
    bind(VesCodegenService).toSelf().inSingletonScope();
});
