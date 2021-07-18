import { injectable, postConstruct } from 'inversify';
import { ApplicationShell } from '@theia/core/lib/browser';
import { ScmHistoryContribution } from '@theia/scm-extra/lib/browser/history/scm-history-contribution';

@injectable()
export class VesScmHistoryContribution extends ScmHistoryContribution {
    // move git history to right sidebar by default
    get defaultViewOptions(): ApplicationShell.WidgetOptions {
        return {
            ...this.options.defaultWidgetOptions,
            area: 'right',
            rank: 600,
        };
    }

    @postConstruct()
    protected async openInitially(): Promise<void> {
        this.openView({ activate: true, reveal: true });
    }
}
