import { interfaces } from 'inversify';
import { PluginViewRegistry } from "@theia/plugin-ext/lib/main/browser/view/plugin-view-registry";
import { VesTheiaCleanPluginContribution } from './plugin-contribution';

export function bindTheiaCustomizationPluginModule(bind: interfaces.Bind, rebind: interfaces.Rebind): void {
    bind(VesTheiaCleanPluginContribution).toSelf().inSingletonScope();
    rebind(PluginViewRegistry).toService(VesTheiaCleanPluginContribution);
}
