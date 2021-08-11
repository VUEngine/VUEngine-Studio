import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/lib/common/event';
import { CancellationToken, CancellationTokenSource } from '@theia/core/lib/common/cancellation';
import { HostedPluginSupport } from '@theia/plugin-ext/lib/hosted/browser/hosted-plugin';
import { ProgressService } from '@theia/core/lib/common/progress-service';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { PreferenceInspectionScope, PreferenceService } from '@theia/core/lib/browser';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { VesPluginsSearchModel } from './ves-plugins-search-model';
import { VesPlugin, VesPluginFactory } from './ves-plugin';

@injectable()
export class VesPluginsModel {

    protected readonly onDidChangeEmitter = new Emitter<void>();
    readonly onDidChange = this.onDidChangeEmitter.event;

    @inject(HostedPluginSupport)
    protected readonly pluginSupport: HostedPluginSupport;

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

    protected readonly initialized = new Deferred<void>();

    @postConstruct()
    protected async init(): Promise<void> {
        await Promise.all([
            this.initSearchResult(),
            this.initInstalled(),
            this.initRecommended(),
        ]);
        this.initialized.resolve();
    }

    protected async initInstalled(): Promise<void> {
        await this.pluginSupport.willStart;
        this.pluginSupport.onDidChangePlugins(() => this.updateInstalled());
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
    protected doChange<T>(task: () => Promise<T>, token: CancellationToken): Promise<T | undefined>;
    protected doChange<T>(task: () => Promise<T>, token: CancellationToken = CancellationToken.None): Promise<T | undefined> {
        return this.progressService.withProgress('', 'plugins', async () => {
            if (token && token.isCancellationRequested) {
                return undefined;
            }
            const result = await task();
            if (token && token.isCancellationRequested) {
                return undefined;
            }
            this.onDidChangeEmitter.fire(undefined);
            return result;
        });
    }

    protected searchCancellationTokenSource = new CancellationTokenSource();
    protected updateSearchResult = () => console.log('NOOP');
    protected doUpdateSearchResult(param: string, token: CancellationToken): Promise<void> {
        return this.doChange(async () => {
            // this._searchResult = searchResult;
        }, token);
    }

    protected async updateInstalled(): Promise<void> {
        const prevInstalled = this._installed;
        return this.doChange(async () => {
            const plugins = this.pluginSupport.plugins;
            const currInstalled = new Set<string>();
            const refreshing = [];
            for (const plugin of plugins) {
                if (plugin.model.engine.type === 'vscode') {
                    const id = plugin.model.id;
                    this._installed.delete(id);
                    const plg = this.setPlugin(id);
                    currInstalled.add(plg.id);
                    refreshing.push(this.refresh(id));
                }
            }
            for (const id of this._installed) {
                refreshing.push(this.refresh(id));
            }
            Promise.all(refreshing);
            const installed = new Set([...prevInstalled, ...currInstalled]);
            const installedSorted = Array.from(installed).sort((a, b) => this.comparePlugins(a, b));
            this._installed = new Set(installedSorted.values());
        });
    }

    protected updateRecommended(): Promise<Array<VesPlugin | undefined>> {
        return this.doChange<Array<VesPlugin | undefined>>(async () => {
            const allRecommendations = new Set<string>();
            const allUnwantedRecommendations = new Set<string>();

            const updateRecommendationsForScope = (scope: PreferenceInspectionScope, root?: URI) => {
                // const recommendations = this.getRecommendationsForScope(scope, root);
                // recommendations.forEach(recommendation => allRecommendations.add(recommendation));
            };

            updateRecommendationsForScope('defaultValue'); // In case there are application-default recommendations.
            const roots = await this.workspaceService.roots;
            for (const root of roots) {
                updateRecommendationsForScope('workspaceFolderValue', root.resource);
            }
            if (this.workspaceService.saved) {
                updateRecommendationsForScope('workspaceValue');
            }
            const recommendedSorted = new Set(Array.from(allRecommendations).sort((a, b) => this.comparePlugins(a, b)).values());
            allUnwantedRecommendations.forEach(unwantedRecommendation => recommendedSorted.delete(unwantedRecommendation));
            this._recommended = recommendedSorted;
            return Promise.all(Array.from(recommendedSorted, plugin => this.refresh(plugin)));
        });
    }

    protected getRecommendationsForScope(scope: PreferenceInspectionScope, root?: URI): Required<string[]> {
        // const configuredValue = this.preferences.inspect<Required<string[]>>('plugins', root?.toString())?.[scope];
        return [];
    }

    resolve(id: string): Promise<VesPlugin> {
        return this.doChange(async () => {
            await this.initialized.promise;
            const plugin = await this.refresh(id);
            if (!plugin) {
                throw new Error(`Failed to resolve ${id} plugin.`);
            }
            if (plugin.readmeUrl) {
                try {
                    // const rawReadme = await this.client.fetchText(plugin.readmeUrl);
                    // const readme = this.compileReadme(rawReadme);
                    // plugin.update({ readme });
                    console.log('NOOP');
                } catch (e) {
                    console.error(`[${id}]: failed to compile readme, reason:`, e);
                }
            }
            return plugin;
        });
    }

    protected compileReadme(readmeMarkdown: string): string {
        return 'test';
    }

    protected async refresh(id: string): Promise<VesPlugin | undefined> {
        try {
            const plugin = this.getPlugin(id);
            return plugin;
            /* const data = await this.client.getLatestCompatiblePluginVersion(id);
                if (!data) {
                    return;
                }
                if (data.error) {
                    return this.onDidFailRefresh(id, data.error);
                }
                plugin = this.setPlugin(id);
                plugin.update(Object.assign(data, {
                    publisher: data.namespace,
                    downloadUrl: data.files.download,
                    iconUrl: data.files.icon,
                    readmeUrl: data.files.readme,
                    licenseUrl: data.files.license,
                    version: data.version
                }));
                return plugin; */
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
     * Compare two plugins based on their display name, and publisher if applicable.
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
        if (pluginA.publisher && pluginB.publisher) {
            return pluginA.publisher.localeCompare(pluginB.publisher);
        }
        return 0;
    }
}
