import { PreferenceService } from '@theia/core/lib/browser';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { VesCommonService } from '../../branding/browser/ves-common-service';
import { VesProjectPreferenceIds } from './ves-project-preferences';

@injectable()
export class VesProjectPathsService {
  @inject(EnvVariablesServer)
  protected envVariablesServer: EnvVariablesServer;
  @inject(FileService)
  protected fileService: FileService;
  @inject(PreferenceService)
  protected readonly preferenceService: PreferenceService;
  @inject(VesCommonService)
  protected readonly vesCommonService: VesCommonService;

  async getProjectsBaseUri(): Promise<URI> {
    const homedir = await this.envVariablesServer.getHomeDirUri();
    const homedirUri = new URI(homedir).withScheme('file');
    const defaultUri = homedirUri
      .resolve('vuengine')
      .resolve('projects');

    const customUri = new URI(this.preferenceService.get(
      VesProjectPreferenceIds.BASE_PATH
    ) as string).withScheme('file');

    return (!customUri.isEqual(new URI('').withScheme('file')) && await this.fileService.exists(customUri))
      ? customUri
      : defaultUri;
  }
}
