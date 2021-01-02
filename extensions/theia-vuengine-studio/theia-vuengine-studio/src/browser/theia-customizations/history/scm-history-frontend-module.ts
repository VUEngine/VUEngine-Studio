import { interfaces } from 'inversify';
import { bindTheiaCustomizationScmHistoryContribution } from './scm-history-contribution';
import { ScmHistoryContribution } from '@theia/scm-extra/lib/browser/history/scm-history-contribution';

export function bindTheiaCustomizationScmHistoryModule(bind: interfaces.Bind, rebind: interfaces.Rebind): void {
    bind(bindTheiaCustomizationScmHistoryContribution).toSelf().inSingletonScope();
    rebind(ScmHistoryContribution).toService(bindTheiaCustomizationScmHistoryContribution);
}
