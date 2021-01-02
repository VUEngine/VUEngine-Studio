import { interfaces } from 'inversify';
import { DebugConsoleContribution } from '@theia/debug/lib/browser/console/debug-console-contribution';
import { DebugFrontendApplicationContribution } from '@theia/debug/lib/browser/debug-frontend-application-contribution';
import { DebugPrefixConfiguration } from '@theia/debug/lib/browser/debug-prefix-configuration';
import { VesTheiaCustomizationDebugContribution } from './debug-contribution';

export function bindTheiaCustomizationDebugModule(bind: interfaces.Bind, rebind: interfaces.Rebind): void {
    bind(VesTheiaCustomizationDebugContribution).toSelf().inSingletonScope();
    rebind(DebugFrontendApplicationContribution).toService(VesTheiaCustomizationDebugContribution);

    rebind(DebugConsoleContribution).toConstantValue({
        registerCommands: () => { },
        registerMenus: () => { },
        registerKeybindings: () => { },
        registerToolbarItems: () => { }
    } as any);

    rebind(DebugPrefixConfiguration).toConstantValue({
        registerCommands: () => { },
        registerMenus: () => { },
        registerKeybindings: () => { },
        registerToolbarItems: () => { }
    } as any);
}
