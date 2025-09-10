import { WidgetOpenerOptions, WidgetOpenHandler } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { EditorManager } from '@theia/editor/lib/browser';
import { VesProjectDashboardWidget } from './ves-project-dashboard-widget';

@injectable()
export class VesProjectDashboardOpenHandler extends WidgetOpenHandler<VesProjectDashboardWidget> {
    readonly id = VesProjectDashboardWidget.ID;
    readonly label = VesProjectDashboardWidget.ID;
    readonly supported = ['GameConfig'];

    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    canHandle(uri: URI): number {
        if (this.supported.includes(uri.path.name)) {
            return Number.MAX_SAFE_INTEGER;
        }

        return 0;
    }

    async open(uri: URI, options?: WidgetOpenerOptions): Promise<VesProjectDashboardWidget> {
        const widget = await super.open(uri, options);
        return widget;
    }

    protected createWidgetOptions(uri: URI): object {
        return { uri: uri.withoutFragment().toString() };
    }
}
