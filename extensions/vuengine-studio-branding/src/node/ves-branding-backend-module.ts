import { ContainerModule } from 'inversify';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { VesEnvVariablesServer } from './ves-branding-variables-server';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    rebind(EnvVariablesServer).to(VesEnvVariablesServer).inSingletonScope();
});
