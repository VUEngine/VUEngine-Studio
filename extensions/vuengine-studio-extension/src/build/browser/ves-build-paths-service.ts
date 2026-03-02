import { isWindows, PreferenceService } from '@theia/core';
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

  async getEngineUri(): Promise<URI> {
    const resourcesUri = await this.vesCommonService.getResourcesUri();
    const builtInFolderUri = resourcesUri.resolve('vb');
    const builtInFolderPath = builtInFolderUri.path.fsPath();

    const fallbackUri = builtInFolderUri.resolve('vuengine');
    let coreUri = fallbackUri;

    const preference = `${this.preferenceService.get(VesBuildPreferenceIds.ENGINE_PATH)}`
      .replace('%BUILTIN%', builtInFolderPath);

    if (preference !== '') {
      const preferenceUri = new URI(isWindows && !preference.startsWith('/')
        ? `/${preference}`
        : preference
      ).withScheme('file');

      if (!preferenceUri.isEqual(new URI('').withScheme('file')) && await this.fileService.exists(preferenceUri)) {
        coreUri = preferenceUri;
      }
    }

    return coreUri;
  }

  async getEngineCoreUri(): Promise<URI> {
    const engineUri = await this.getEngineUri();
    const engineCoreUri = engineUri.resolve('core');
    if (await this.fileService.exists(engineCoreUri)) {
      return engineCoreUri;
    }

    return engineUri;
  }

  async getEnginePlatformsUri(): Promise<URI> {
    const engineUri = await this.getEngineUri();
    return engineUri.resolve('platforms');
  }

  async getEnginePluginsUri(): Promise<URI> {
    const engineUri = await this.getEngineUri();
    return engineUri.resolve('plugins');
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
