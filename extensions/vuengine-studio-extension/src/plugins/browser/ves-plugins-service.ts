import * as glob from 'glob';
import { join as joinPath, relative as relativePath, sep } from 'path';
import { PreferenceService } from '@theia/core/lib/browser';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import { EncodingService } from '@theia/core/lib/common/encoding-service';
import { Deferred } from '@theia/core/lib/common/promise-util';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/shared/vscode-languageserver-protocol';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { VesCommonService } from '../../branding/browser/ves-common-service';
import { VesPluginData, VesPluginsData } from './ves-plugin';
import { VUENGINE_PLUGINS_PREFIX } from './ves-plugins-types';
import { VesPluginsPathsService } from './ves-plugins-paths-service';
import { FileChangesEvent } from '@theia/filesystem/lib/common/files';

@injectable()
export class VesPluginsService {

  @inject(EncodingService)
  protected encodingService: EncodingService;
  @inject(FileService)
  protected fileService: FileService;
  @inject(PreferenceService)
  protected preferenceService: PreferenceService;
  @inject(VesCommonService)
  protected vesCommonService: VesCommonService;
  @inject(VesPluginsPathsService)
  protected vesPluginsPathsService: VesPluginsPathsService;

  protected pluginsData: VesPluginsData;

  protected readonly _ready = new Deferred<void>();
  get ready(): Promise<void> {
    return this._ready.promise;
  }

  protected installedPlugins: Array<string> = [];

  // events
  protected readonly onInstalledPluginsChangedEmitter = new Emitter<void>();
  readonly onInstalledPluginsChanged = this.onInstalledPluginsChangedEmitter.event;

  @postConstruct()
  protected async init(): Promise<void> {
    // Re-determine installedPlugins when plugins file changes
    this.fileService.onDidFilesChange(async (fileChangesEvent: FileChangesEvent) => {
      const pluginsFileUri = this.getPluginsFileUri();
      if (fileChangesEvent.contains(pluginsFileUri)) {
        await this.determineInstalledPlugins();
        this.onInstalledPluginsChangedEmitter.fire();
      }
    });
  }

  getPluginById(id: string): VesPluginData | undefined {
    return this.pluginsData[id] ?? undefined;
  }

  isInstalled(id: string): boolean {
    return this.installedPlugins.includes(id);
  }

  async installPlugin(id: string): Promise<void> {
    if (!this.installedPlugins.includes(id)) {
      this.installedPlugins.push(id);
      this.onInstalledPluginsChangedEmitter.fire();
      await this.writeInstalledPluginsToFile();
    }
  }

  async uninstallPlugin(id: string): Promise<void> {
    const index = this.installedPlugins.indexOf(id);
    if (index > -1) {
      this.installedPlugins.splice(index, 1);
      this.onInstalledPluginsChangedEmitter.fire();
      await this.writeInstalledPluginsToFile();
    }
  }

  async determineInstalledPlugins(): Promise<Array<string>> {
    try {
      const pluginsFileUri = this.getPluginsFileUri();
      const fileContent = await this.fileService.readFile(pluginsFileUri);
      const fileContentParsed = JSON.parse(fileContent.value.toString());
      this.installedPlugins = fileContentParsed;
      this._ready.resolve();
      return this.installedPlugins;
    } catch (e) {
      this._ready.resolve();
      return [];
    }
  }

  getInstalledPlugins(): Array<string> {
    return this.installedPlugins;
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

  // note: tests with caching plugin data in a single did not increase performance much
  async setPluginsData(): Promise<void> {
    const startTime = performance.now();
    const enginePluginsPath = await this.vesPluginsPathsService.getEnginePluginsPath();
    const userPluginsPath = await this.vesPluginsPathsService.getUserPluginsPath();

    const findPlugins = async (rootPath: string, prefix: string) => {
      const pluginsMap: any = {}; /* eslint-disable-line */

      // TODO: refactor to use fileservice
      await Promise.all(glob.sync(joinPath(rootPath, '**', 'plugin.json')).map(async file => {
        const fileSplit = file.split(`${sep}plugin.json`);
        const pluginPathFull = fileSplit[0];

        const pluginPathRelative = relativePath(rootPath, pluginPathFull);
        const fileContent = await this.fileService.readFile(new URI(file));
        const fileContentJson = JSON.parse(fileContent.value.toString());

        const pluginId = `${prefix}//${pluginPathRelative}`;

        if (fileContentJson.icon !== '' && !fileContentJson.icon.includes('..')) {
          fileContentJson.icon = joinPath(pluginPathFull, fileContentJson.icon);
        }
        if (fileContentJson.readme !== '' && !fileContentJson.readme.includes('..')) {
          fileContentJson.readme = joinPath(pluginPathFull, fileContentJson.readme);
        }

        fileContentJson.name = pluginId;

        pluginsMap[pluginId] = fileContentJson;
      }));

      return pluginsMap;
    };

    const pluginsMap = {
      ...await findPlugins(enginePluginsPath, 'vuengine'),
      ...await findPlugins(userPluginsPath, 'user'),
    };

    const duration = performance.now() - startTime;
    console.log(`Getting VUEngine plugins data took: ${Math.round(duration)} ms.`);

    this.pluginsData = pluginsMap;
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
      if (pluginData.tags?.map(tag => tag.toLowerCase()).includes(tag.toLowerCase()) && pluginData.name) {
        searchResult.push(pluginData);
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

  getPluginsFileUri(): URI {
    const path = joinPath(this.vesCommonService.getWorkspaceRoot(), 'config', 'Plugins.json');
    return new URI(path);
  }

  protected async writeInstalledPluginsToFile(): Promise<void> {
    const pluginsFileUri = this.getPluginsFileUri();
    const updatedFileContent = JSON.stringify(this.installedPlugins.sort(), null, 4);
    await this.fileService.writeFile(pluginsFileUri, BinaryBuffer.fromString(updatedFileContent));
  }
}
