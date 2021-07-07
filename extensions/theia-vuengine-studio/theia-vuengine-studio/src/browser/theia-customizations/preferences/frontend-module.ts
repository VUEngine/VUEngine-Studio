import { interfaces } from 'inversify';
import { PreferenceConfigurations } from '@theia/core/lib/browser/preferences/preference-configurations';
import { VesPreferenceConfigurations } from './preference-configurations';

export function bindTheiaCustomizationPreferencesModule(bind: interfaces.Bind, rebind: interfaces.Rebind): void {
    bind(VesPreferenceConfigurations).toSelf().inSingletonScope();
    rebind(PreferenceConfigurations).toService(VesPreferenceConfigurations);
}
