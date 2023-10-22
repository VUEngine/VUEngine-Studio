import { ContainerModule } from '@theia/core/shared/inversify';
import { BackendApplicationContribution } from '@theia/core/lib/node';
import { EmulatorBackendContribution } from './ves-emulator-backend-contribution';

export default new ContainerModule(bind => {
    bind(BackendApplicationContribution).to(EmulatorBackendContribution).inSingletonScope();
});
