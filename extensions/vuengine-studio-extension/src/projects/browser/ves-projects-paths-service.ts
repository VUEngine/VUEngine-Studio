import { PreferenceService } from '@theia/core/lib/browser';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { VesCommonService } from '../../branding/browser/ves-common-service';

@injectable()
export class VesProjectsPathsService {
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

    return homedirUri
      .resolve('vuengine')
      .resolve('projects');
  }
}
