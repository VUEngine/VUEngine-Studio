import { interfaces } from '@theia/core/shared/inversify';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { VesEnvVariablesServer } from './variables-server';

export function bindVesEnvVariablesServer(rebind: interfaces.Rebind): void {
    rebind(EnvVariablesServer).to(VesEnvVariablesServer).inSingletonScope();
};