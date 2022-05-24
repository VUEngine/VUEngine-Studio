import URI from '@theia/core/lib/common/uri';

export namespace VesEditorUri {
    export function toUri(id: string): URI {
        return new URI(`ves-editor:${id}`);
    }
    export function toId(uri: URI): string | undefined {
        if (uri.scheme === 'ves-editor') {
            return uri.path.toString();
        }
        return undefined;
    }
}
