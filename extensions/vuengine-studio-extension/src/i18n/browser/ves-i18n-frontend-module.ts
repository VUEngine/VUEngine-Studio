import { ContainerModule } from '@theia/core/shared/inversify';
import reassignTheiaCommandLabels from './ves-i18n-command-label-overrides';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    reassignTheiaCommandLabels();
});
