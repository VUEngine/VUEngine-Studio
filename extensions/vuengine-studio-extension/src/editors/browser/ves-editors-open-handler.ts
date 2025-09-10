import { WidgetOpenHandler } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { VesEditorsWidget, VesEditorsWidgetOptions } from './ves-editors-widget';

@injectable()
export class VesEditorsOpenHandler extends WidgetOpenHandler<VesEditorsWidget> {
    @inject(VesProjectService)
    protected vesProjectService: VesProjectService;

    protected typeId: string;

    readonly id = VesEditorsWidget.ID;

    async canHandle(uri: URI): Promise<number> {
        await this.vesProjectService.projectDataReady;
        const types = this.vesProjectService.getProjectDataTypes();
        for (const typeId of Object.keys(types || {})) {
            if ([uri.path.ext, uri.path.base].includes(types![typeId].file)) {
                this.typeId = typeId;
                return 1000;
            }
        }

        return 0;
    }

    protected createWidgetOptions(uri: URI): VesEditorsWidgetOptions {
        return {
            typeId: this.typeId,
            uri: uri.withoutFragment().toString(),
        };
    }
}
