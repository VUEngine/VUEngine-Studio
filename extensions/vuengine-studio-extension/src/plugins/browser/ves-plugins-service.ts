import { Deferred } from '@theia/core/lib/common/promise-util';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/shared/vscode-languageserver-protocol';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesGlobService } from '../../glob/common/ves-glob-service-protocol';
import { VesPluginData, VesPluginsData } from './ves-plugin';
import { VesPluginsPathsService } from './ves-plugins-paths-service';
import { VUENGINE_PLUGINS_PREFIX } from './ves-plugins-types';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { nls } from '@theia/core';

@injectable()
export class VesPluginsService {

  @inject(FileService)
  protected fileService: FileService;
  @inject(VesGlobService)
  protected vesGlobService: VesGlobService;
  @inject(VesPluginsPathsService)
  protected vesPluginsPathsService: VesPluginsPathsService;
  @inject(VesProjectService)
  protected vesProjectService: VesProjectService;
  @inject(WorkspaceService)
  protected workspaceService: WorkspaceService;

  protected pluginsData: VesPluginsData;

  protected readonly _ready = new Deferred<void>();
  get ready(): Promise<void> {
    return this._ready.promise;
  }

  protected installedPlugins: Array<string> = [];

  protected readonly onDidChangeInstalledPluginsEmitter = new Emitter<void>();
  readonly onDidChangeInstalledPlugins = this.onDidChangeInstalledPluginsEmitter.event;

  @postConstruct()
  protected async init(): Promise<void> {
    this.vesProjectService.onDidChangeProjectData(async () => {
      if (JSON.stringify(this.installedPlugins) !== JSON.stringify(this.vesProjectService.getProjectPlugins())) {
        await this.determineInstalledPlugins();
        this.onDidChangeInstalledPluginsEmitter.fire();
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
      this.onDidChangeInstalledPluginsEmitter.fire();
      await this.writeInstalledPluginsToFile();
    }
  }

  async uninstallPlugin(id: string): Promise<void> {
    const index = this.installedPlugins.indexOf(id);
    if (index > -1) {
      this.installedPlugins.splice(index, 1);
      this.onDidChangeInstalledPluginsEmitter.fire();
      await this.writeInstalledPluginsToFile();
    }
  }

  async determineInstalledPlugins(): Promise<void> {
    await this.vesProjectService.ready;
    this.installedPlugins = this.vesProjectService.getProjectPlugins();
    this._ready.resolve();
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

  // note: tests with caching plugin data in a single file did not increase performance much
  async setPluginsData(): Promise<void> {
    const startTime = performance.now();
    const enginePluginsUri = await this.vesPluginsPathsService.getEnginePluginsUri();
    const userPluginsUri = await this.vesPluginsPathsService.getUserPluginsUri();

    const findPlugins = async (rootUri: URI, prefix: string) => {
      const rootPath = (await this.fileService.fsPath(rootUri)).replace(/\\/g, '/');
      const pluginsMap: any = {};

      const pluginFiles = await this.vesGlobService.find(rootPath, '**/plugin.vuengine');
      for (const pluginFile of pluginFiles) {
        const pluginFileUri = new URI(pluginFile).withScheme('file');
        const pluginFolderUri = pluginFileUri.parent;

        const pluginPathRelative = rootUri.relative(pluginFolderUri)!.toString();
        const fileContent = await this.fileService.readFile(pluginFileUri);
        try {
          let fileContentJson = JSON.parse(fileContent.value.toString()).plugin;

          const pluginId = `${prefix}//${pluginPathRelative.replace(/\\/g, '/')}`;

          fileContentJson.name = pluginId;
          const iconUri = pluginFolderUri.resolve('icon.png');
          fileContentJson.icon = await this.fileService.exists(iconUri)
            ? iconUri.path.toString()
            : '';
          fileContentJson.readme = pluginFolderUri.resolve('readme.md').path.toString();

          fileContentJson.displayName = this.translateField(fileContentJson.displayName, nls.locale || 'en');
          fileContentJson.author = this.translateField(fileContentJson.author, nls.locale || 'en');
          fileContentJson.description = this.translateField(fileContentJson.description, nls.locale || 'en');
          fileContentJson.license = this.translateField(fileContentJson.license, nls.locale || 'en');

          if (Array.isArray(fileContentJson.tags)) {
            const tagsObject = {};
            fileContentJson.tags.forEach((tag: any) => {
              // @ts-ignore
              tagsObject[this.translateField(tag, 'en')] = this.translateField(tag, nls.locale);
            });
            fileContentJson.tags = tagsObject;
          } else {
            fileContentJson.tags = {};
          }

          pluginsMap[pluginId] = fileContentJson;
        } catch (e) {
          console.error(pluginPathRelative, e);
        }
      }

      return pluginsMap;
    };

    const pluginsMap = {
      ...await findPlugins(enginePluginsUri, 'vuengine'),
      ...await findPlugins(userPluginsUri, 'user'),
    };

    const duration = performance.now() - startTime;
    console.log(`Getting VUEngine plugins data took: ${Math.round(duration)} ms.`);

    this.pluginsData = pluginsMap;
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

  protected async writeInstalledPluginsToFile(): Promise<void> {
    await this.vesProjectService.setProjectPlugins(this.installedPlugins.sort());
  }
}
