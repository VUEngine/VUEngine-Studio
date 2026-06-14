import { ApplicationShell, FrontendApplication } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { OutlineViewContribution } from '@theia/outline-view/lib/browser/outline-view-contribution';

@injectable()
export class VesOutlineViewContribution extends OutlineViewContribution {
    async initializeLayout(app: FrontendApplication): Promise<void> {
        // do not initially open view
    }

    get defaultViewOptions(): ApplicationShell.WidgetOptions {
        return {
            ...this.options.defaultWidgetOptions,
            area: 'left'
        };
    }
}
