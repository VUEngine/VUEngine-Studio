import { Deferred } from '@theia/core/lib/common/promise-util';
import { inject, injectable } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/shared/vscode-languageserver-protocol';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesPluginData, VesPluginsData } from './ves-plugin';
import { VesPluginsPathsService } from './ves-plugins-paths-service';
import { PluginTagCounts, VUENGINE_PLUGINS_PREFIX } from './ves-plugins-types';

@injectable()
export class VesPluginsService {
  @inject(FileService)
  protected fileService: FileService;
  @inject(VesCommonService)
  protected vesCommonService: VesCommonService;
  @inject(VesPluginsPathsService)
  protected vesPluginsPathsService: VesPluginsPathsService;
  @inject(WorkspaceService)
  protected workspaceService: WorkspaceService;

  protected pluginsData: VesPluginsData;

  protected readonly _ready = new Deferred<void>();
  get ready(): Promise<void> {
    return this._ready.promise;
  }

  protected installedPlugins: Array<string> = [];

  protected readonly onDidChangePluginsDataEmitter = new Emitter<void>();
  readonly onDidChangePluginsData = this.onDidChangePluginsDataEmitter.event;

  protected readonly onDidChangeInstalledPluginsEmitter = new Emitter<string[]>();
  readonly onDidChangeInstalledPlugins = this.onDidChangeInstalledPluginsEmitter.event;

  getPluginById(id: string): VesPluginData | undefined {
    return this.pluginsData[id] ?? undefined;
  }

  isInstalled(id: string): boolean {
    return this.installedPlugins.includes(id);
  }

  // get actually used plugins by resolving dependencies of installed plugins
  getActualUsedPluginNames(): string[] {
    const actualUsedPlugins: string[] = [];

    const loopPlugins = (plugins: string[]) => plugins.forEach(plugin => {
      if (this.pluginsData[plugin] && !actualUsedPlugins.includes(plugin)) {
        actualUsedPlugins.push(plugin);
        if (this.pluginsData[plugin].dependencies?.length) {
          loopPlugins(this.pluginsData[plugin].dependencies!);
        }
      }
    });

    loopPlugins(this.installedPlugins);

    return actualUsedPlugins.sort();
  }

  async installPlugin(id: string): Promise<void> {
    if (!this.installedPlugins.includes(id)) {
      this.installedPlugins.push(id);
      this.onDidChangeInstalledPluginsEmitter.fire(this.installedPlugins.sort());
    }
  }

  async uninstallPlugin(id: string): Promise<void> {
    const index = this.installedPlugins.indexOf(id);
    if (index > -1) {
      this.installedPlugins.splice(index, 1);
      this.onDidChangeInstalledPluginsEmitter.fire(this.installedPlugins.sort());
    }
  }

  setInstalledPlugins(installedPlugins: string[]): void {
    this.installedPlugins = installedPlugins;
    this._ready.resolve();
  }

  getInstalledPlugins(): Array<string> {
    return this.installedPlugins;
  }

  getPluginTags(): PluginTagCounts {
    const tags: PluginTagCounts = {};
    Object.values(this.pluginsData).forEach(plugin =>
      Object.values(plugin.tags || {}).forEach(tag => {
        if (tags[tag] === undefined) {
          tags[tag] = 1;
        } else {
          tags[tag] = tags[tag] + 1;
        }
      })
    );
    return tags;
  }

  getRecommendedPlugins(): Array<string> {
    return [
      `${VUENGINE_PLUGINS_PREFIX}other/I18n`,
      `${VUENGINE_PLUGINS_PREFIX}other/SaveDataManager`,
      `${VUENGINE_PLUGINS_PREFIX}states/splash/AdjustmentScreenNintendo`,
      `${VUENGINE_PLUGINS_PREFIX}states/splash/AutomaticPauseSelectionScreen`,
      `${VUENGINE_PLUGINS_PREFIX}states/splash/LanguageSelectionScreen`,
      `${VUENGINE_PLUGINS_PREFIX}states/splash/PrecautionScreen`,
    ];
  }

  setPluginsData(pluginsData: VesPluginsData): void {
    this.pluginsData = pluginsData;
    this.onDidChangePluginsDataEmitter.fire();
  }

  protected translateField(field: Object | string, locale: string): string {
    if (field instanceof Object) {
      // @ts-ignore
      return field[locale] || field.en || '';
    }

    return field;
  }

  searchPluginsData(query: string): Array<VesPluginData> {
    const searchResult = [];

    // TODO: weighted search through all fields, then order by score desc
    for (const pluginData of Object.values(this.pluginsData)) {
      if (pluginData.name?.toLowerCase().includes(query.toLowerCase()) && pluginData.name) {
        searchResult.push(pluginData);
      }
    }

    return searchResult;
  }

  searchPluginsByTag(tag: string): Array<VesPluginData> {
    const searchResult = [];

    for (const pluginData of Object.values(this.pluginsData)) {
      if (pluginData.tags) {
        if (Object.keys(pluginData.tags).map(tag => tag.toLowerCase()).includes(tag.toLowerCase()) && pluginData.name) {
          searchResult.push(pluginData);
        }
      }
    }

    return searchResult;
  }

  searchPluginsByAuthor(author: string): Array<VesPluginData> {
    const searchResult = [];

    for (const pluginData of Object.values(this.pluginsData)) {
      if (pluginData.author?.toLowerCase().includes(author.toLowerCase()) && pluginData.name) {
        searchResult.push(pluginData);
      }
    }

    return searchResult;
  }
}
