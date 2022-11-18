import { ContainerModule } from '@theia/core/shared/inversify';
import { VesAudioConverterService } from './ves-audio-converter-service';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // service
    bind(VesAudioConverterService).toSelf().inSingletonScope();
});
