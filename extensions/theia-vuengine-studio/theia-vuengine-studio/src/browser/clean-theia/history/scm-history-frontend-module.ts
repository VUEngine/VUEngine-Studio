import { interfaces } from 'inversify';
import { VesScmHistoryContribution } from './scm-history-contribution';
import { ScmHistoryContribution } from '@theia/scm-extra/lib/browser/history/scm-history-contribution';

export function rebindScmHistoryModule(bind: interfaces.Bind, rebind: interfaces.Rebind): void {
    bind(VesScmHistoryContribution).toSelf().inSingletonScope();
    rebind(ScmHistoryContribution).toService(VesScmHistoryContribution);
}
