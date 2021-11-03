import { dirname, join as joinPath, normalize, relative as relativePath, sep } from 'path';
import * as glob from 'glob';
import { isWindows } from '@theia/core';
import { Emitter } from '@theia/core/shared/vscode-languageserver-protocol';
import { EncodingService } from '@theia/core/lib/common/encoding-service';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { PreferenceService } from '@theia/core/lib/browser';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import { VesPluginsPreferenceIds } from './ves-plugins-preferences';
import { VesPluginData, VesPluginsData } from './ves-plugin';

@injectable()
export class VesPluginsService {

  @inject(EncodingService)
  protected encodingService: EncodingService;
  @inject(EnvVariablesServer)
  protected envVariablesServer: EnvVariablesServer;
  @inject(FileService)
  protected fileService: FileService;
  @inject(PreferenceService)
  protected preferenceService: PreferenceService;

  protected pluginsData: VesPluginsData;

  protected readonly _ready = new Deferred<void>();
  get ready(): Promise<void> {
    return this._ready.promise;
  }

  protected _installedPlugins: string[] = [];
  protected readonly onDidChangeinstalledPluginsEmitter = new Emitter<string[]>();
  readonly onDidChangeinstalledPlugins = this.onDidChangeinstalledPluginsEmitter.event;
  set installedPlugins(plugins: string[]) {
    this._installedPlugins = plugins;
    this.onDidChangeinstalledPluginsEmitter.fire(this._installedPlugins);
  }
  get installedPlugins(): string[] {
    return this._installedPlugins;
  }

  @postConstruct()
  protected async init(): Promise<void> {
    this.onDidChangeinstalledPlugins(async () => {
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
    });
  }

  protected async getResourcesPath(): Promise<string> {
    const envVar = await this.envVariablesServer.getValue('THEIA_APP_PROJECT_PATH');
    const applicationPath = envVar && envVar.value ? envVar.value : '';
    return applicationPath;
  }

  async getEnginePluginsPath(): Promise<string> {
    const defaultPath = joinPath(
      await this.getResourcesPath(),
      'vuengine',
      'vuengine-plugins'
    );
    const customPath = normalize(this.preferenceService.get(
      VesPluginsPreferenceIds.ENGINE_PLUGINS_PATH
    ) as string);

    return customPath && (customPath !== '.' && await this.fileService.exists(new URI(customPath)))
      ? customPath
      : defaultPath;
  }

  async getUserPluginsPath(): Promise<string> {
    const path = normalize(this.preferenceService.get(
      VesPluginsPreferenceIds.USER_PLUGINS_PATH
    ) as string);

    return path;
  }

  protected getWorkspaceRoot(): string {
    const substrNum = isWindows ? 2 : 1;

    return window.location.hash.slice(-9) === 'workspace'
      ? dirname(window.location.hash.substring(substrNum))
      : window.location.hash.substring(substrNum);
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
      // trigger change event
      this.installedPlugins = this.installedPlugins;
    }
  }

  uninstallPlugin(id: string): void {
    const index = this.installedPlugins.indexOf(id);
    if (index > -1) {
      this.installedPlugins.splice(index, 1);
      // trigger change event
      this.installedPlugins = this.installedPlugins;
    }
  }

  protected getPluginsFileUri(): URI {
    const path = joinPath(this.getWorkspaceRoot(), 'config', 'Compiler.json');
    return new URI(path);
  }

  async determineInstalledPlugins(): Promise<string[]> {
    try {
      const pluginsFileUri = this.getPluginsFileUri();
      const fileContent = await this.fileService.readFile(pluginsFileUri);
      const fileContentParsed = JSON.parse(fileContent.value.toString());
      // write directly to property to not trigger change event
      this._installedPlugins = fileContentParsed.plugins;
      this._ready.resolve();
      return this.installedPlugins;
    } catch (e) {
      this._ready.resolve();
      return [];
    }
  }

  getRecommendedPlugins(): string[] {
    return [
      'vuengine//other/I18n',
      'vuengine//other/SaveDataManager',
      'vuengine//states/splash/AdjustmentScreenNintendo',
      'vuengine//states/splash/AutomaticPauseSelectionScreen',
      'vuengine//states/splash/LanguageSelectionScreen',
      'vuengine//states/splash/PrecautionScreen',
    ];
  }

  async setPluginsData(): Promise<void> {
    const enginePluginsPath = await this.getEnginePluginsPath();
    const userPluginsPath = await this.getUserPluginsPath();

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

  searchPluginsData(query: string): VesPluginData[] {
    const searchResult = [];

    // TODO: weighted search through all fields, then order by score desc

    for (const pluginData of Object.values(this.pluginsData)) {
      if (pluginData.name?.toLowerCase().includes(query.toLowerCase()) && pluginData.name) {
        searchResult.push(pluginData);
      }
    }

    return searchResult;
  }

  searchPluginsByTag(tag: string): VesPluginData[] {
    const searchResult = [];

    for (const pluginData of Object.values(this.pluginsData)) {
      if (pluginData.tags?.map(tag => tag.toLowerCase()).includes(tag.toLowerCase()) && pluginData.name) {
        searchResult.push(pluginData);
      }
    }

    return searchResult;
  }

  searchPluginsByAuthor(author: string): VesPluginData[] {
    const searchResult = [];

    for (const pluginData of Object.values(this.pluginsData)) {
      if (pluginData.author?.toLowerCase().includes(author.toLowerCase()) && pluginData.name) {
        searchResult.push(pluginData);
      }
    }

    return searchResult;
  }

  /**
   * Returns a list of all plugins the current project uses, including implicitly included ones through dependencies
   */
  /* protected async getProjectPlugins(): Promise<string[]> {
    let allPlugins: string[] = [];
    const enginePluginsPath = await this.getEnginePluginsPath();

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
