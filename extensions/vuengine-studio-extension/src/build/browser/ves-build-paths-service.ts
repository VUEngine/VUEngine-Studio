import { join as joinPath, normalize } from 'path';
import { inject, injectable } from '@theia/core/shared/inversify';
import { PreferenceService } from '@theia/core/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import URI from '@theia/core/lib/common/uri';
import { VesCommonService } from '../../branding/browser/ves-common-service';
import { VesBuildPreferenceIds } from './ves-build-preferences';

@injectable()
export class VesBuildPathsService {
  @inject(FileService)
  protected fileService: FileService;
  @inject(PreferenceService)
  protected readonly preferenceService: PreferenceService;
  @inject(VesCommonService)
  protected readonly vesCommonService: VesCommonService;

  getBuildFolder(): string {
    return joinPath(this.vesCommonService.getWorkspaceRoot(), 'build');
  }

  getBuildPath(buildMode?: string): string {
    const buildFolder = this.getBuildFolder();

    return buildMode
      ? joinPath(buildFolder, buildMode.toLowerCase())
      : buildFolder;
  }

  getRomPath(): string {
    return joinPath(this.getBuildPath(), 'output.vb');
  }

  async getEngineCorePath(): Promise<string> {
    const defaultPath = joinPath(
      await this.vesCommonService.getResourcesPath(),
      'vuengine',
      'vuengine-core'
    );
    const customPath = normalize(this.preferenceService.get(
      VesBuildPreferenceIds.ENGINE_CORE_PATH
    ) as string);

    return customPath && (customPath !== '.' && await this.fileService.exists(new URI(customPath)))
      ? customPath
      : defaultPath;
  }

  async getCompilerPath(): Promise<string> {
    return joinPath(
      await this.vesCommonService.getResourcesPath(),
      'binaries',
      'vuengine-studio-tools',
      this.vesCommonService.getOs(),
      'gcc'
    );
  }

  async getMsysBashPath(): Promise<string> {
    return joinPath(
      await this.vesCommonService.getResourcesPath(),
      'binaries',
      'vuengine-studio-tools',
      this.vesCommonService.getOs(),
      'msys',
      'usr',
      'bin',
      'bash.exe'
    );
  }
}
