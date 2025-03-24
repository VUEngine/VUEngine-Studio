import { ContainerModule } from '@theia/core/shared/inversify';
import { BackendApplicationContribution } from '@theia/core/lib/node';
import { EditorsBackendContribution } from './ves-editors-backend-contribution';

export default new ContainerModule(bind => {
    bind(BackendApplicationContribution).to(EditorsBackendContribution).inSingletonScope();
});
