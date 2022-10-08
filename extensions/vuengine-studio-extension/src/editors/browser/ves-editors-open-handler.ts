import { WidgetOpenHandler } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { injectable } from '@theia/core/shared/inversify';
import { VesEditorUri } from './ves-editor-uri';
import { VesEditorsWidget, VesEditorsWidgetOptions } from './ves-editors-widget';

@injectable()
export class VesEditorsOpenHandler extends WidgetOpenHandler<VesEditorsWidget> {
    readonly id = VesEditorsWidget.ID;

    canHandle(uri: URI): number {
        const id = VesEditorUri.toId(uri);

        return !!id ? 500 : 0;
    }

    protected createWidgetOptions(uri: URI): VesEditorsWidgetOptions {
        const id = VesEditorUri.toId(uri);
        if (!id) {
            throw new Error(`Invalid URI: ${uri.toString()}`);
        }

        const idParts = id.split('/');

        return { typeId: idParts[0], itemId: idParts[1] };
    }
}
