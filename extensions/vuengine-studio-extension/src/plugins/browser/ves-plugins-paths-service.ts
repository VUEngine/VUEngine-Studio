import { isWindows, PreferenceService } from '@theia/core';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesPluginsPreferenceIds } from './ves-plugins-preferences';

@injectable()
export class VesPluginsPathsService {
  @inject(EnvVariablesServer)
  protected envVariablesServer: EnvVariablesServer;
  @inject(FileService)
  protected fileService: FileService;
  @inject(PreferenceService)
  protected preferenceService: PreferenceService;
  @inject(VesCommonService)
  protected vesCommonService: VesCommonService;

  async getEnginePluginsUri(): Promise<URI> {
    const resourcesUri = await this.vesCommonService.getResourcesUri();
    const builtInFolderUri = resourcesUri.resolve('vb');
    const builtInFolderPath = builtInFolderUri.path.fsPath();

    const fallbackUri = builtInFolderUri.resolve('vuengine').resolve('plugins');
    let pluginsUri = fallbackUri;

    const preference = `${this.preferenceService.get(VesPluginsPreferenceIds.ENGINE_PLUGINS_PATH)}`
      .replace('%BUILTIN%', builtInFolderPath);

    if (preference !== '') {
      const preferenceUri = new URI(isWindows && !preference.startsWith('/')
        ? `/${preference}`
        : preference
      ).withScheme('file');

      if (!preferenceUri.isEqual(new URI('').withScheme('file')) && await this.fileService.exists(preferenceUri)) {
        pluginsUri = preferenceUri;
      }
    }

    return pluginsUri;
  }

  async getUserPluginsUri(): Promise<URI> {
    const homedir = await this.envVariablesServer.getHomeDirUri();
    const homedirUri = new URI(homedir).withScheme('file');
    let pluginsUri = homedirUri
      .resolve('vuengine')
      .resolve('plugins');

    const preference = `${this.preferenceService.get(VesPluginsPreferenceIds.USER_PLUGINS_PATH)}`;
    if (preference !== '') {
      const customUri = new URI(isWindows && !preference?.startsWith('/')
        ? `/${preference}`
        : preference
      ).withScheme('file');
      if (!customUri.isEqual(new URI('').withScheme('file')) && await this.fileService.exists(customUri)) {
        pluginsUri = customUri;
      }
    }

    return pluginsUri;
  }
}
