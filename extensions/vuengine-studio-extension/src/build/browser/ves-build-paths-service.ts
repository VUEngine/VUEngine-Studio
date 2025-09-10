import { isWindows } from '@theia/core';
import { PreferenceService } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesBuildPreferenceIds } from './ves-build-preferences';

@injectable()
export class VesBuildPathsService {
  @inject(FileService)
  protected fileService: FileService;
  @inject(PreferenceService)
  protected readonly preferenceService: PreferenceService;
  @inject(VesCommonService)
  protected readonly vesCommonService: VesCommonService;

  async getEngineCoreUri(): Promise<URI> {
    const resourcesUri = await this.vesCommonService.getResourcesUri();
    let coreUri = resourcesUri
      .resolve('vuengine')
      .resolve('core');

    const preference = this.preferenceService.get(VesBuildPreferenceIds.ENGINE_CORE_PATH) as string;
    if (preference !== '') {
      const customUri = new URI(isWindows && !preference.startsWith('/')
        ? `/${preference}`
        : preference
      ).withScheme('file');
      if (!customUri.isEqual(new URI('').withScheme('file'))) {
        coreUri = customUri;
      }
    }

    return coreUri;
  }

  async getMakeUri(isWslInstalled: boolean = false): Promise<URI> {
    const resourcesUri = await this.vesCommonService.getResourcesUri();
    return resourcesUri
      .resolve('binaries')
      .resolve('vuengine-studio-tools')
      .resolve(isWslInstalled ? 'linux' : this.vesCommonService.getOs())
      .resolve('make');
  }

  async getSedUri(isWslInstalled: boolean = false): Promise<URI> {
    const resourcesUri = await this.vesCommonService.getResourcesUri();
    return resourcesUri
      .resolve('binaries')
      .resolve('vuengine-studio-tools')
      .resolve(isWslInstalled ? 'linux' : this.vesCommonService.getOs())
      .resolve('gnu-sed');
  }

  async getCompilerUri(isWslInstalled: boolean = false): Promise<URI> {
    const resourcesUri = await this.vesCommonService.getResourcesUri();
    return resourcesUri
      .resolve('binaries')
      .resolve('vuengine-studio-tools')
      .resolve(isWslInstalled ? 'linux' : this.vesCommonService.getOs())
      .resolve('gcc');
  }

  async getMsysBashUri(): Promise<URI> {
    const resourcesUri = await this.vesCommonService.getResourcesUri();
    return resourcesUri
      .resolve('binaries')
      .resolve('vuengine-studio-tools')
      .resolve(this.vesCommonService.getOs())
      .resolve('msys')
      .resolve('usr')
      .resolve('bin')
      .resolve('bash.exe');
  }
}
