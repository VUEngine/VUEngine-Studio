import { isOSX, isWindows } from '@theia/core';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';

@injectable()
export class VesCommonService {
  @inject(EnvVariablesServer)
  protected envVariablesServer: EnvVariablesServer;

  getOs(): string {
    return isWindows ? 'win' : isOSX ? 'osx' : 'linux';
  }

  async getResourcesUri(): Promise<URI> {
    const envVar = await this.envVariablesServer.getValue('THEIA_APP_PROJECT_PATH');
    const applicationPath = envVar && envVar.value 
      ? isWindows 
        ? `/${envVar.value.replace(/\\/g, '/')}`
        : envVar.value
      : '';

    return new URI(applicationPath).withScheme('file');
  }
}
