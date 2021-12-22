import { PreferenceService } from '@theia/core/lib/browser';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { VesCommonService } from '../../branding/browser/ves-common-service';
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
    const defaultUri = resourcesUri
      .resolve('vuengine')
      .resolve('vuengine-plugins');
    const customUri = new URI(this.preferenceService.get(
      VesPluginsPreferenceIds.ENGINE_PLUGINS_PATH
    ) as string).withScheme('file');

    return (!customUri.isEqual(new URI('').withScheme('file')) && await this.fileService.exists(customUri))
      ? customUri
      : defaultUri;
  }

  async getUserPluginsUri(): Promise<URI> {
    const homedir = await this.envVariablesServer.getHomeDirUri();
    const homedirUri = new URI(homedir).withScheme('file');
    const defaultUri = homedirUri
      .resolve('vuengine')
      .resolve('plugins');
    const customUri = new URI(this.preferenceService.get(
      VesPluginsPreferenceIds.USER_PLUGINS_PATH
    ) as string).withScheme('file');

    return (!customUri.isEqual(new URI('').withScheme('file')) && await this.fileService.exists(customUri))
      ? customUri
      : defaultUri;
  }
}
