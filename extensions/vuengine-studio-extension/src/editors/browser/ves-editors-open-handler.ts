import { NavigatableWidgetOpenHandler } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { PROJECT_TYPES } from '../../project/browser/ves-project-data';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { ViewModeService } from '../../viewMode/browser/view-mode-service';
import { TYPE_VIEW_MODE_RELATIONS } from '../../viewMode/browser/view-mode-types';
import { VesEditorsWidget, VesEditorsWidgetOptions } from './ves-editors-widget';

@injectable()
export class VesEditorsOpenHandler extends NavigatableWidgetOpenHandler<VesEditorsWidget> {
    @inject(VesProjectService)
    protected vesProjectService: VesProjectService;
    @inject(ViewModeService)
    protected viewModeService: ViewModeService;

    protected typeId: string;

    readonly id = VesEditorsWidget.ID;

    canHandle(uri: URI): number {
        for (const typeId of Object.keys(PROJECT_TYPES)) {
            if ([uri.path.ext, uri.path.base].includes(PROJECT_TYPES[typeId].file)) {
                this.typeId = typeId;
                return 1000;
            }
        }

        return 0;
    }

    protected async changeViewMode(): Promise<void> {
        await this.viewModeService.setViewMode(TYPE_VIEW_MODE_RELATIONS[this.typeId]);
    }

    protected createWidgetOptions(uri: URI): VesEditorsWidgetOptions {
        this.changeViewMode();
        return {
            typeId: this.typeId,
            uri: uri.withoutFragment().toString(),
            kind: 'navigatable',
        };
    }
}
