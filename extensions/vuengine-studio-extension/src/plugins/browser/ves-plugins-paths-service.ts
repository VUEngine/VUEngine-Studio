import { PreferenceService } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { join } from 'path';
import { VesCommonService } from '../../branding/browser/ves-common-service';
import { VesPluginsPreferenceIds, VesPluginsPreferenceSchema } from './ves-plugins-preferences';

@injectable()
export class VesPluginsPathsService {

  @inject(FileService)
  protected fileService: FileService;
  @inject(PreferenceService)
  protected preferenceService: PreferenceService;
  @inject(VesCommonService)
  protected vesCommonService: VesCommonService;

  async getEnginePluginsUri(): Promise<URI> {
    const resourcesUri = await this.vesCommonService.getResourcesUri();
    const defaultUri = resourcesUri.resolve(join(
      'vuengine',
      'vuengine-plugins'
    ));
    const customUri = new URI(this.preferenceService.get(
      VesPluginsPreferenceIds.ENGINE_PLUGINS_PATH
    ) as string);

    return (!customUri.isEqual(new URI('')) && await this.fileService.exists(customUri))
      ? customUri
      : defaultUri;
  }

  async getUserPluginsUri(): Promise<URI> {
    const defaultUri = VesPluginsPreferenceSchema.properties[VesPluginsPreferenceIds.USER_PLUGINS_PATH].default;
    const customUri = new URI(this.preferenceService.get(
      VesPluginsPreferenceIds.USER_PLUGINS_PATH
    ) as string);

    return (!customUri.isEqual(new URI('')) && await this.fileService.exists(customUri))
      ? customUri
      : defaultUri;
  }
}
