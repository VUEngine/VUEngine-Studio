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
  protected readonly onPluginInstalledEmitter = new Emitter<string>();
  readonly onPluginInstalled = this.onPluginInstalledEmitter.event;
  protected readonly onPluginUninstalledEmitter = new Emitter<string>();
  readonly onPluginUninstalled = this.onPluginUninstalledEmitter.event;

  @postConstruct()
  protected async init(): Promise<void> {
    this.onPluginInstalled(async () => await this.handleInstalledPluginsChange());
    this.onPluginUninstalled(async () => await this.handleInstalledPluginsChange());
  }

  getPluginById(id: string): VesPluginData | undefined {
    return this.pluginsData[id] ?? undefined;
  }

  isInstalled(id: string): boolean {
    return this.installedPlugins.includes(id);
  }

  installPlugin(id: string): void {
    if (!this.installedPlugins.includes(id)) {
      this.installedPlugins.push(id);
      this.onPluginInstalledEmitter.fire(id);
    }
  }

  uninstallPlugin(id: string): void {
    const index = this.installedPlugins.indexOf(id);
    if (index > -1) {
      this.installedPlugins.splice(index, 1);
      this.onPluginUninstalledEmitter.fire(id);
    }
  }

  async determineInstalledPlugins(): Promise<Array<string>> {
    try {
      const pluginsFileUri = this.getPluginsFileUri();
      const fileContent = await this.fileService.readFile(pluginsFileUri);
      const fileContentParsed = JSON.parse(fileContent.value.toString());
      this.installedPlugins = fileContentParsed.plugins;
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

  async setPluginsData(): Promise<void> {
    const enginePluginsPath = await this.vesPluginsPathsService.getEnginePluginsPath();
    const userPluginsPath = await this.vesPluginsPathsService.getUserPluginsPath();

    const findPlugins = async (path: string, prefix: string) => {
      const pluginsMap: any = {}; /* eslint-disable-line */

      // TODO: refactor to use fileservice
      await Promise.all(glob.sync(joinPath(path, '**', 'plugin.json')).map(async file => {
        const fileSplit = file.split(`${sep}plugin.json`);
        const pluginPathFull = fileSplit[0];

        const pluginPathRelative = relativePath(path, pluginPathFull);
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

  protected async handleInstalledPluginsChange(): Promise<void> {
    try {
      // read
      const pluginsFileUri = this.getPluginsFileUri();
      const fileContent = await this.fileService.readFile(pluginsFileUri);
      let fileContentParsed = JSON.parse(fileContent.value.toString());
      // update
      fileContentParsed.plugins = this.installedPlugins;
      fileContentParsed.plugins.sort();
      // write
      const updatedFileContent = JSON.stringify(fileContentParsed, null, 4);
      /* await */ this.fileService.writeFile(pluginsFileUri, BinaryBuffer.fromString(updatedFileContent));
    } catch (e) {
      // no-op
    }
  }

  protected getPluginsFileUri(): URI {
    const path = joinPath(this.vesCommonService.getWorkspaceRoot(), 'config', 'Compiler.json');
    return new URI(path);
  }

  /**
   * Returns a list of all plugins the current project uses, including implicitly included ones through dependencies
   */
  /* protected async getProjectPlugins(): Promise<Array<string>> {
    let allPlugins: Array<string> = [];
    const enginePluginsPath = await this.vesPluginsPathsService.getEnginePluginsPath();

    // get project's plugins
    try {
      const configFileUri = new URI(
        joinPath(
          this.getWorkspaceRoot(),
          '.vuengine',
          'plugins.json'
        )
      );
      const configFileContents = await this.fileService.readFile(configFileUri);
      const projectPlugins = JSON.parse(configFileContents.value.toString());
      allPlugins = projectPlugins;

      // for each of the project's plugins, get its dependencies
      // TODO: we only search one level deep here, recurse instead
      await Promise.all(projectPlugins.map(async (pluginName: string) => {
        const pluginFileUri = new URI(
          joinPath(
            enginePluginsPath,
            ...pluginName.split('/'),
            '.vuengine',
            'plugins.json'
          )
        );

        const pluginFileContents = await this.fileService.readFile(pluginFileUri);
        JSON.parse(pluginFileContents.value.toString()).map(
          (plugin: string) => {
            if (!allPlugins.includes(plugin)) {
              allPlugins.push(plugin);
            }
          }
        );
      }));
    } catch (e) {
      // TODO
    }

    // remove duplicates and return
    return allPlugins;
  } */
}
