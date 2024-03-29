import { WidgetOpenHandler } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { injectable } from '@theia/core/shared/inversify';
import { VesPluginUri } from './ves-plugin-uri';
import { VesPluginOptions } from './ves-plugin';
import { VesPluginEditor } from './ves-plugin-editor';

@injectable()
export class VesPluginEditorManager extends WidgetOpenHandler<VesPluginEditor> {

    readonly id = VesPluginEditor.ID;

    canHandle(uri: URI): number {
        const id = VesPluginUri.toId(uri);

        return !!id ? 500 : 0;
    }

    protected createWidgetOptions(uri: URI): VesPluginOptions {
        const id = VesPluginUri.toId(uri);
        if (!id) {
            throw new Error(`Invalid URI: ${uri.toString()}`);
        }

        return { id };
    }
}
