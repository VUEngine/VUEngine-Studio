import { join as joinPath, normalize } from 'path';
import { PreferenceService } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { VesCommonService } from '../../branding/browser/ves-common-service';
import { VesPluginsPreferenceIds } from './ves-plugins-preferences';

@injectable()
export class VesPluginsPathsService {

  @inject(FileService)
  protected fileService: FileService;
  @inject(PreferenceService)
  protected preferenceService: PreferenceService;
  @inject(VesCommonService)
  protected vesCommonService: VesCommonService;

  async getEnginePluginsPath(): Promise<string> {
    const defaultPath = joinPath(
      await this.vesCommonService.getResourcesPath(),
      'vuengine',
      'vuengine-plugins'
    );
    const customPath = normalize(this.preferenceService.get<string>(
      VesPluginsPreferenceIds.ENGINE_PLUGINS_PATH
    ) ?? '');

    return customPath && (customPath !== '.' && await this.fileService.exists(new URI(customPath)))
      ? customPath
      : defaultPath;
  }

  async getUserPluginsPath(): Promise<string> {
    const path = normalize(this.preferenceService.get<string>(
      VesPluginsPreferenceIds.USER_PLUGINS_PATH
    ) ?? '');

    return path;
  }
}
