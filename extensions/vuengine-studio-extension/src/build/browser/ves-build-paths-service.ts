import { PreferenceService } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { join } from 'path';
import { VesCommonService } from '../../branding/browser/ves-common-service';
import { VesBuildPreferenceIds } from './ves-build-preferences';
import { BuildMode } from './ves-build-types';

@injectable()
export class VesBuildPathsService {
  @inject(FileService)
  protected fileService: FileService;
  @inject(PreferenceService)
  protected readonly preferenceService: PreferenceService;
  @inject(VesCommonService)
  protected readonly vesCommonService: VesCommonService;

  getBuildPathUri(buildMode?: BuildMode): URI {
    const buildPathUri = this.vesCommonService.getWorkspaceRootUri().resolve('build');

    return buildMode
      ? buildPathUri.resolve(buildMode.toLowerCase())
      : buildPathUri;
  }

  getRomUri(): URI {
    return this.getBuildPathUri().resolve('output.vb');
  }

  async getEngineCoreUri(): Promise<URI> {
    const resourcesUri = await this.vesCommonService.getResourcesUri();
    const defaultUri = resourcesUri.resolve(join(
      'vuengine',
      'vuengine-core'
    ));
    const customUri = new URI(this.preferenceService.get(
      VesBuildPreferenceIds.ENGINE_CORE_PATH
    ) as string);

    return (!customUri.isEqual(new URI('')) && await this.fileService.exists(customUri))
      ? customUri
      : defaultUri;
  }

  async getCompilerUri(): Promise<URI> {
    const resourcesUri = await this.vesCommonService.getResourcesUri();
    return resourcesUri.resolve(join(
      'binaries',
      'vuengine-studio-tools',
      this.vesCommonService.getOs(),
      'gcc'
    ));
  }

  async getMsysBashUri(): Promise<URI> {
    const resourcesUri = await this.vesCommonService.getResourcesUri();
    return resourcesUri.resolve(join(
      'binaries',
      'vuengine-studio-tools',
      this.vesCommonService.getOs(),
      'msys',
      'usr',
      'bin',
      'bash.exe'
    ));
  }
}
