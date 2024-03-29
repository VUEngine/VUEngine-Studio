import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { ContainerModule } from '@theia/core/shared/inversify';
import { VesEnvVariablesServer } from './ves-core-variables-server';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    rebind(EnvVariablesServer).to(VesEnvVariablesServer).inSingletonScope();
});
