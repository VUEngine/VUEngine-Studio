import * as showdown from 'showdown';
import * as sanitize from 'sanitize-html';
import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/lib/common/event';
import { ProgressService } from '@theia/core/lib/common/progress-service';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { PreferenceService } from '@theia/core/lib/browser';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { AUTHOR_SEARCH_QUERY, TAG_SEARCH_QUERY, VesPluginsSearchModel } from './ves-plugins-search-model';
import { FrontendApplicationState, FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { VesPlugin, VesPluginFactory } from './ves-plugin';
import { VesPluginsService } from './ves-plugins-service';
import URI from '@theia/core/lib/common/uri';

@injectable()
export class VesPluginsModel {

    protected readonly onDidChangeEmitter = new Emitter<void>();
    readonly onDidChange = this.onDidChangeEmitter.event;

    @inject(FileService)
    protected readonly fileService: FileService;

    @inject(FrontendApplicationStateService)
    protected readonly frontendApplicationStateService: FrontendApplicationStateService;

    @inject(VesPluginFactory)
    protected readonly pluginFactory: VesPluginFactory;

    @inject(ProgressService)
    protected readonly progressService: ProgressService;

    @inject(PreferenceService)
    protected readonly preferences: PreferenceService;

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    @inject(VesPluginsSearchModel)
    readonly search: VesPluginsSearchModel;

    @inject(VesPluginsService)
    readonly pluginsService: VesPluginsService;

    protected readonly initialized = new Deferred<void>();

    @postConstruct()
    protected async init(): Promise<void> {
        this.frontendApplicationStateService.onStateChanged(async (state: FrontendApplicationState) => {
            if (state === 'attached_shell') {
                await this.pluginsService.setPluginsData();
                await this.pluginsService.determineInstalledPlugins();
                await Promise.all([
                    this.initSearchResult(),
                    this.initInstalled(),
                    this.initRecommended(),
                ]);
                this.initialized.resolve();

                this.pluginsService.onDidChangeinstalledPlugins(() => this.updateInstalled());
            };
        });
    }

    protected async initInstalled(): Promise<void> {
        try {
            await this.updateInstalled();
        } catch (e) {
            console.error(e);
        }
    }

    protected async initSearchResult(): Promise<void> {
        this.search.onDidChangeQuery(() => this.updateSearchResult());
        try {
            this.updateSearchResult();
        } catch (e) {
            console.error(e);
        }
    }

    protected async initRecommended(): Promise<void> {
        this.preferences.onPreferenceChanged(change => {
            if (change.preferenceName === 'plugins') {
                this.updateRecommended();
            }
        });
        await this.preferences.ready;
        try {
            await this.updateRecommended();
        } catch (e) {
            console.error(e);
        }
    }

    /**
     * single source of all plugins
     */
    protected readonly plugins = new Map<string, VesPlugin>();

    protected _installed = new Set<string>();
    get installed(): IterableIterator<string> {
        return this._installed.values();
    }

    isInstalled(id: string): boolean {
        return this._installed.has(id);
    }

    protected _searchResult = new Set<string>();
    get searchResult(): IterableIterator<string> {
        return this._searchResult.values();
    }

    protected _recommended = new Set<string>();
    get recommended(): IterableIterator<string> {
        return this._recommended.values();
    }

    getPlugin(id: string): VesPlugin | undefined {
        return this.plugins.get(id);
    }

    protected setPlugin(id: string): VesPlugin {
        let plugin = this.plugins.get(id);
        if (!plugin) {
            plugin = this.pluginFactory({ id });
            this.plugins.set(id, plugin);
        }
        return plugin;
    }

    protected doChange<T>(task: () => Promise<T>): Promise<T>;
    protected doChange<T>(task: () => Promise<T>): Promise<T | undefined> {
        return this.progressService.withProgress('', 'plugins', async () => {
            const result = await task();
            this.onDidChangeEmitter.fire(undefined);
            return result;
        });
    }

    protected updateSearchResult(): Promise<void> {
        return this.doChange(async () => {
            const query = this.search.query;

            let results = [];
            if (query.startsWith(TAG_SEARCH_QUERY)) {
                results = this.pluginsService.searchPluginsByTag(query.slice(TAG_SEARCH_QUERY.length));
            } else if (query.startsWith(AUTHOR_SEARCH_QUERY)) {
                results = this.pluginsService.searchPluginsByAuthor(query.slice(AUTHOR_SEARCH_QUERY.length));
            } else {
                results = this.pluginsService.searchPluginsData(query);
            }

            const searchResult = new Set<string>();

            for (const data of results) {
                if (data) {
                    const id = data.name;
                    if (id) {
                        this.setPlugin(id).update(Object.assign(data, {
                            displayName: data.displayName,
                            author: data.author,
                            description: data.description,
                            icon: data.icon,
                            readme: data.readme,
                        }));
                        searchResult.add(id);
                    }
                }
            }

            this._searchResult = searchResult;
        });
    };

    protected async updateInstalled(): Promise<void> {
        const prevInstalled = this._installed;
        return this.doChange(async () => {
            const pluginIds = this.pluginsService.installedPlugins;
            const currInstalled = new Set<string>();
            for (const pluginId of pluginIds) {
                this._installed.delete(pluginId);
                const vesPlugin = this.setPlugin(pluginId);
                currInstalled.add(vesPlugin.id);
            }
            const installed = new Set([...prevInstalled, ...currInstalled]);
            const installedSorted = Array.from(installed).sort((a, b) => this.comparePlugins(a, b));
            this._installed = new Set(installedSorted.values());
        });
    }

    protected updateRecommended(): Promise<Array<VesPlugin | undefined>> {
        return this.doChange<Array<VesPlugin | undefined>>(async () => {
            const allRecommendations = new Set<string>();

            const recommendations = this.pluginsService.getRecommendedPlugins();
            recommendations.forEach(recommendation => allRecommendations.add(recommendation));

            const recommendedSorted = new Set(Array.from(allRecommendations).sort((a, b) => this.comparePlugins(a, b)).values());
            this._recommended = recommendedSorted;
            return Promise.all(Array.from(recommendedSorted, plugin => this.refresh(plugin)));
        });
    }

    resolve(id: string): Promise<VesPlugin> {
        return this.doChange(async () => {
            await this.initialized.promise;
            const plugin = await this.refresh(id);
            if (!plugin) {
                throw new Error(`Failed to resolve ${id} plugin.`);
            }
            if (plugin.readme) {
                try {
                    const rawReadme = await this.fileService.readFile(new URI(plugin.readme));
                    const readme = this.compileReadme(rawReadme.value.toString());
                    plugin.update({ readme });
                } catch (e) {
                    console.error(`[${id}]: failed to compile readme, reason:`, e);
                }
            }
            return plugin;
        });
    }

    protected compileReadme(readmeMarkdown: string): string {
        const markdownConverter = new showdown.Converter({
            noHeaderId: true,
            strikethrough: true,
            headerLevelStart: 2
        });

        const readmeHtml = markdownConverter.makeHtml(readmeMarkdown);
        return sanitize(readmeHtml, {
            allowedTags: sanitize.defaults.allowedTags.concat(['h1', 'h2', 'img'])
        });
    }

    protected async refresh(id: string): Promise<VesPlugin | undefined> {
        try {
            let plugin = this.getPlugin(id);
            const data = this.pluginsService.getPluginById(id);
            if (!data) {
                return;
            }
            plugin = this.setPlugin(id);
            plugin.update(Object.assign(data, {
                displayName: data.displayName,
                author: data.author,
                description: data.description,
                icon: data.icon,
                readme: data.readme,
            }));
            return plugin;
        } catch (e) {
            return this.onDidFailRefresh(id, e);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected onDidFailRefresh(id: string, error: any): VesPlugin | undefined {
        const cached = this.getPlugin(id);
        if (cached && cached.installed) {
            return cached;
        }
        console.error(`[${id}]: failed to refresh, reason:`, error);
        return undefined;
    }

    /**
     * Compare two plugins based on their display name, and author if applicable.
     * @param a the first plugin id for comparison.
     * @param b the second plugin id for comparison.
     */
    protected comparePlugins(a: string, b: string): number {
        const pluginA = this.getPlugin(a);
        const pluginB = this.getPlugin(b);
        if (!pluginA || !pluginB) {
            return 0;
        }
        if (pluginA.displayName && pluginB.displayName) {
            return pluginA.displayName.localeCompare(pluginB.displayName);
        }
        if (pluginA.author && pluginB.author) {
            return pluginA.author.localeCompare(pluginB.author);
        }
        return 0;
    }
}