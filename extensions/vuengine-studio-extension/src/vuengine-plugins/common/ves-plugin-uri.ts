import URI from '@theia/core/lib/common/uri';

export namespace VesPluginUri {
    export function toUri(id: string): URI {
        return new URI(`ves:plugin/${id}`);
    }
    export function toId(uri: URI): string | undefined {
        if (uri.scheme === 'ves' && uri.path.dir.toString() === 'plugin') {
            return uri.path.base;
        }
        return undefined;
    }
}