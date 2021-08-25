import { injectable } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/lib/common/event';

export enum VesPluginsSearchMode {
    Initial,
    None,
    Search,
    Installed,
    Recommended,
}

export const INSTALLED_QUERY = '@installed';
export const RECOMMENDED_QUERY = '@recommended';
export const TAG_SEARCH_QUERY = '@tag:';
export const AUTHOR_SEARCH_QUERY = '@author:';

@injectable()
export class VesPluginsSearchModel {

    protected readonly onDidChangeQueryEmitter = new Emitter<string>();
    readonly onDidChangeQuery = this.onDidChangeQueryEmitter.event;
    protected readonly specialQueries = new Map<string, VesPluginsSearchMode>([
        [INSTALLED_QUERY, VesPluginsSearchMode.Installed],
        [RECOMMENDED_QUERY, VesPluginsSearchMode.Recommended],
    ]);

    protected _query = '';
    set query(query: string) {
        if (this._query === query) {
            return;
        }
        this._query = query;
        this.onDidChangeQueryEmitter.fire(this._query);
    }
    get query(): string {
        return this._query;
    }

    getModeForQuery(): VesPluginsSearchMode {
        return this.query
            ? this.specialQueries.get(this.query) ?? VesPluginsSearchMode.Search
            : VesPluginsSearchMode.None;
    }
}
