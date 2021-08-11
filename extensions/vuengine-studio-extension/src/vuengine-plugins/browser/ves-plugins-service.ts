import { basename, dirname, join as joinPath, relative as relativePath } from 'path';
import * as glob from 'glob';
import { isWindows } from '@theia/core';
import { EncodingService } from '@theia/core/lib/common/encoding-service';
import { inject, injectable } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { PreferenceService } from '@theia/core/lib/browser';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { VesBuildPreferenceIds } from '../../build/browser/ves-build-preferences';
import { VesPluginsPreferenceIds } from './ves-plugins-preferences';

@injectable()
export class VesPluginsService {
  constructor(
    @inject(EncodingService)
    protected encodingService: EncodingService,
    @inject(EnvVariablesServer)
    protected envVariablesServer: EnvVariablesServer,
    @inject(FileService)
    protected fileService: FileService,
    @inject(PreferenceService)
    protected preferenceService: PreferenceService,
  ) { }

  protected async getResourcesPath(): Promise<string> {
    const envVar = await this.envVariablesServer.getValue('THEIA_APP_PROJECT_PATH');
    const applicationPath = envVar && envVar.value ? envVar.value : '';
    return applicationPath;
  }

  protected async getEngineCorePath(): Promise<string> {
    const defaultPath = joinPath(
      await this.getResourcesPath(),
      'vuengine',
      'vuengine-core'
    );
    const customPath = this.preferenceService.get(
      VesBuildPreferenceIds.ENGINE_CORE_PATH
    ) as string;

    return customPath && (await this.fileService.exists(new URI(customPath)))
      ? customPath
      : defaultPath;
  }

  async getEnginePluginsPath(): Promise<string> {
    const defaultPath = joinPath(
      await this.getResourcesPath(),
      'vuengine',
      'vuengine-plugins'
    );
    const customPath = this.preferenceService.get(
      VesPluginsPreferenceIds.ENGINE_PLUGINS_PATH
    ) as string;

    return customPath && (await this.fileService.exists(new URI(customPath)))
      ? customPath
      : defaultPath;
  }

  protected getWorkspaceRoot(): string {
    const substrNum = isWindows ? 2 : 1;

    return window.location.hash.slice(-9) === 'workspace'
      ? dirname(window.location.hash.substring(substrNum))
      : window.location.hash.substring(substrNum);
  }

  /**
   * Writes a map file for all VUEngine plugins to the build directory for the makefiles to work with
   */
  async writePluginsMap(): Promise<boolean> {
    // const engineCorePath = await this.getEngineCorePath();
    const enginePluginsPath = await this.getEnginePluginsPath();
    let pluginsMap = 'core:$(ENGINE_FOLDER)\n';
    const self = this;

    glob(joinPath(enginePluginsPath, '/**/', '.vuengine', 'plugin.json'), {}, function (error, matches) { /* eslint-disable-line */
      if (!error) {
        for (const match of matches) {
          const matchSplit = match.split('/.vuengine/plugin.json');
          const pluginPathFull = matchSplit[0];
          const pluginPathRelative = relativePath(enginePluginsPath, pluginPathFull);
          const pluginId = 'vuengine/' + basename(pluginPathRelative).toLowerCase();
          pluginsMap += `${pluginId}:$(PLUGINS_FOLDER)${pluginPathRelative}\n`;
        }
      }

      const encoded = self.encodingService.encode(pluginsMap);
      self.fileService.writeFile(new URI(joinPath(self.getWorkspaceRoot(), 'build', 'plugins.txt')), encoded);
    });

    return true;
  }

  /**
   * Returns a list of all plugins the current project uses
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
