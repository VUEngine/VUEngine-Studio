import { WidgetOpenHandler } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { injectable } from '@theia/core/shared/inversify';
import { VesEditorsTreeEditorOptions, VesEditorsTreeEditorWidget } from './tree/ves-editors-tree-editor-widget';
import { VesEditorUri } from './ves-editor-uri';

@injectable()
export class VesEditorsOpenHandler extends WidgetOpenHandler<VesEditorsTreeEditorWidget> {

    readonly id = VesEditorsTreeEditorWidget.WIDGET_ID;

    canHandle(uri: URI): number {
        const id = VesEditorUri.toId(uri);

        return !!id ? 500 : 0;
    }

    protected createWidgetOptions(uri: URI): VesEditorsTreeEditorOptions {
        const id = VesEditorUri.toId(uri);
        if (!id) {
            throw new Error(`Invalid URI: ${uri.toString()}`);
        }

        return { id, uri: new URI() };
    }
}
