import { injectable, inject } from '@theia/core/shared/inversify';
import { WidgetOpenerOptions, WidgetOpenHandler } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { EditorManager } from '@theia/editor/lib/browser';
import { VesEmulatorWidget, VesEmulatorWidgetOptions } from './widget/ves-emulator-widget';

// Start vb files in the configured default emulator
// TODO: does not work when trying to run vb files with VUEngine Studio from external (e.g. file explorer)

@injectable()
export class VesEmulatorOpenHandler extends WidgetOpenHandler<VesEmulatorWidget> {
    readonly id = VesEmulatorWidget.ID;
    readonly label = 'Emulator';
    readonly supported = [
        '.vb',
    ];

    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    canHandle(uri: URI): number {
        if (this.supported.includes(uri.path.ext)) {
            return Number.MAX_SAFE_INTEGER;
        }

        return 0;
    }

    async open(uri: URI, options?: WidgetOpenerOptions): Promise<VesEmulatorWidget> {
        // When the emulator is already active, it should be opened and reset.
        const widget = await this.getOrCreateWidget(uri, options);
        if (widget.isLoaded()) {
            widget.reload();
        }

        return super.open(uri, options);
    }

    protected createWidgetOptions(uri: URI): VesEmulatorWidgetOptions {
        return { 
            uri: uri.path.toString() }
        ;
    }
}
