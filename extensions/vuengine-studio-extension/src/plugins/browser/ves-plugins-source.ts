import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { TreeSource, TreeElement } from '@theia/core/lib/browser/source-tree';
import { VesPluginsModel } from './ves-plugins-model';

@injectable()
export class VesPluginsSourceOptions {
    static INSTALLED = 'installed';
    static TAGS = 'tags';
    static RECOMMENDED = 'recommended';
    static SEARCH_RESULT = 'search-result';
    readonly id: string;
}

@injectable()
export class VesPluginsSource extends TreeSource {

    @inject(VesPluginsSourceOptions)
    protected readonly options: VesPluginsSourceOptions;

    @inject(VesPluginsModel)
    protected readonly model: VesPluginsModel;

    @postConstruct()
    protected init(): void {
        this.fireDidChange();
        this.toDispose.push(this.model.onDidChangeData(() => this.fireDidChange()));
    }

    *getElements(): IterableIterator<TreeElement> {
        for (const id of this.doGetElements()) {
            if (this.options.id === VesPluginsSourceOptions.TAGS) {
                const pluginTag = this.model.getPluginTag(id);
                if (!pluginTag) {
                    continue;
                }
                yield pluginTag;
            } else {
                const plugin = this.model.getPlugin(id);
                if (!plugin) {
                    continue;
                }
                if (this.options.id === VesPluginsSourceOptions.RECOMMENDED) {
                    if (this.model.isInstalled(id)) {
                        continue;
                    }
                }
                yield plugin;
            }
        }
    }

    protected doGetElements(): IterableIterator<string> {
        if (this.options.id === VesPluginsSourceOptions.SEARCH_RESULT) {
            return this.model.searchResult;
        }
        if (this.options.id === VesPluginsSourceOptions.TAGS) {
            return this.model.tags;
        }
        if (this.options.id === VesPluginsSourceOptions.RECOMMENDED) {
            return this.model.recommended;
        }
        return this.model.installed;
    }
}
