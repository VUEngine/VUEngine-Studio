import {
    FrontendApplicationContribution,
    OpenerService,
    OpenWithService
} from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
import { EditorManager } from '@theia/editor/lib/browser';
import { VesProjectService } from '../../project/browser/ves-project-service';

@injectable()
export class VesEditorsContribution implements FrontendApplicationContribution {
    @inject(EditorManager)
    protected readonly editorManager: EditorManager;
    @inject(OpenerService)
    protected readonly openerService: OpenerService;
    @inject(OpenWithService)
    protected readonly openWithService: OpenWithService;
    @inject(VesProjectService)
    protected readonly vesProjectService: VesProjectService;

    onStart(): void {
        this.registerOpenWithHandler();
    }

    protected async registerOpenWithHandler(): Promise<void> {
        await this.vesProjectService.projectDataReady;

        this.openWithService.registerHandler({
            id: 'graphicalEditor',
            label: nls.localize('vuengine/editors/general/graphicalEditor', 'Graphical Editor'),
            providerName: nls.localizeByDefault('Built-in'),
            canHandle: uri => {
                const types = this.vesProjectService.getProjectDataTypes();
                for (const typeId of Object.keys(types || {})) {
                    if ([uri.path.ext, uri.path.base].includes(types![typeId].file)) {
                        return 1000;
                    }
                }

                return 0;
            },
            getOrder: () => 25000,
            open: async uri => {
                const opener = await this.openerService.getOpener(uri);
                await opener.open(uri);
            },
        });
    }
}
