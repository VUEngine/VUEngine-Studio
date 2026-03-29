import { nls } from '@theia/core';
import { WidgetOpenerOptions, WidgetOpenHandler } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { EditorManager } from '@theia/editor/lib/browser';
import { ViewModeService } from '../../viewMode/browser/view-mode-service';
import { ViewMode } from '../../viewMode/browser/view-mode-types';
import { VesEmulatorWidget, VesEmulatorWidgetOptions } from './ves-emulator-widget';

// Start vb files in the configured default emulator
// TODO: does not work when trying to run vb files with VUEngine Studio from external (e.g. file explorer)

@injectable()
export class VesEmulatorOpenHandler extends WidgetOpenHandler<VesEmulatorWidget> {
    @inject(ViewModeService)
    protected viewModeService: ViewModeService;

    readonly id = VesEmulatorWidget.ID;
    readonly label = nls.localize('vuengine/emulator/emulator', 'Emulator');
    readonly supported = ['.vb'];

    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    canHandle(uri: URI): number {
        if (this.supported.includes(uri.path.ext.toLowerCase())) {
            return Number.MAX_SAFE_INTEGER;
        }

        return 0;
    }

    async open(uri: URI, options?: WidgetOpenerOptions): Promise<VesEmulatorWidget> {
        await this.viewModeService.setViewMode(ViewMode.build);

        // When the emulator is already active, it should be opened and reset.
        const widget = await this.getOrCreateWidget(uri, options);
        if (widget.isLoaded()) {
            widget.reload();
        }

        return super.open(uri, options);
    }

    protected createWidgetOptions(uri: URI): VesEmulatorWidgetOptions {
        return { uri: uri.withoutFragment().toString() };
    }
}
