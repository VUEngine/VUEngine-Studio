import {
    FrontendApplicationContribution,
    OpenerService,
    OpenWithService
} from '@theia/core/lib/browser';
import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
import { EditorManager } from '@theia/editor/lib/browser';
import { PROJECT_TYPES } from '../../project/browser/ves-project-data';

@injectable()
export class VesEditorsContribution implements FrontendApplicationContribution {
    @inject(EditorManager)
    protected readonly editorManager: EditorManager;
    @inject(OpenerService)
    protected readonly openerService: OpenerService;
    @inject(OpenWithService)
    protected readonly openWithService: OpenWithService;

    onStart(): void {
        this.registerOpenWithHandler();
    }

    protected registerOpenWithHandler(): void {
        this.openWithService.registerHandler({
            id: 'graphicalEditor',
            label: nls.localize('vuengine/editors/general/graphicalEditor', 'Graphical Editor'),
            providerName: nls.localizeByDefault('Built-in'),
            canHandle: uri => {
                for (const typeId of Object.keys(PROJECT_TYPES)) {
                    if ([uri.path.ext, uri.path.base].includes(PROJECT_TYPES[typeId].file)) {
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
