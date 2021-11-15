import { injectable, inject } from '@theia/core/shared/inversify';
import { WidgetOpenHandler } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { VesPluginsWidget, VesPluginsWidgetOptions } from './ves-plugins-widget';
import { VesPluginsService } from './ves-plugins-service';
import { VesPluginsSourceOptions } from './ves-plugins-source';

@injectable()
export class VesPluginsOpenHandler extends WidgetOpenHandler<VesPluginsWidget> {
    readonly id = VesPluginsWidget.ID;
    readonly label = 'Plugins Browser';

    @inject(VesPluginsService)
    protected readonly vesPluginsService: VesPluginsService;

    canHandle(uri: URI): number {
        const pluginsFileUri = this.vesPluginsService.getPluginsFileUri();
        if (uri.isEqual(pluginsFileUri)) {
            return Number.MAX_SAFE_INTEGER;
        }

        return 0;
    }

    protected createWidgetOptions(): VesPluginsWidgetOptions {
        return {
            id: VesPluginsSourceOptions.INSTALLED
        };
    }
}
