import { WidgetOpenHandler } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { EditorManager } from '@theia/editor/lib/browser';
import { SUPPORTED_AUDIO_FILES, SUPPORTED_IMAGE_FILES, SUPPORTED_VIDEO_FILES } from './ves-media-preview-types';
import { VesMediaPreviewWidget, VesMediaPreviewWidgetOptions } from './ves-media-preview-widget';

@injectable()
export class VesMediaPreviewOpenHandler extends WidgetOpenHandler<VesMediaPreviewWidget> {
    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    readonly id = VesMediaPreviewWidget.ID;
    readonly label = VesMediaPreviewWidget.LABEL;
    readonly supported = [
        ...SUPPORTED_AUDIO_FILES,
        ...SUPPORTED_IMAGE_FILES,
        ...SUPPORTED_VIDEO_FILES,
    ];

    canHandle(uri: URI): number {
        if (this.supported.includes(uri.path.ext.toLowerCase())) {
            return Number.MAX_SAFE_INTEGER;
        }

        return 0;
    }

    protected createWidgetOptions(uri: URI): VesMediaPreviewWidgetOptions {
        return {
            uri: uri.withoutFragment().toString(),
        };
    }
}
