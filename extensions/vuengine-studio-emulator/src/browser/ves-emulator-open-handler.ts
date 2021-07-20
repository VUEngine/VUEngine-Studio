import { injectable, inject } from 'inversify';
import { WidgetOpenHandler } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { EditorManager } from '@theia/editor/lib/browser';

import { VesEmulatorWidget, VesEmulatorWidgetOptions } from './widget/ves-emulator-widget';

@injectable()
export class VesEmulatorOpenHandler extends WidgetOpenHandler<VesEmulatorWidget> {
    readonly id = VesEmulatorWidget.ID;
    readonly label = 'Emulator';
    readonly supported = [
        '.vb',
    ];

    @inject(EditorManager) protected readonly editorManager: EditorManager;

    canHandle(uri: URI): number {
        if (this.supported.includes(uri.path.ext)) {
            return this.editorManager.canHandle(uri) * 2;
        }

        return 0;
    }

    protected createWidgetOptions(uri: URI): VesEmulatorWidgetOptions {
        return { uri: uri.path.toString() };
    }
}
