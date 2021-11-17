import { isOSX, isWindows } from '@theia/core';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { THEIA_EXT, VSCODE_EXT } from '@theia/workspace/lib/common';
import { dirname } from 'path';

@injectable()
export class VesCommonService {
  @inject(EnvVariablesServer)
  protected envVariablesServer: EnvVariablesServer;

  getOs(): string {
    return isWindows ? 'win' : isOSX ? 'osx' : 'linux';
  }

  getWorkspaceRootUri(): URI {
    const substrNum = isWindows ? 2 : 1;

    const hashPath = window.location.hash.substring(substrNum);
    const hashPathParts = hashPath.split('.');

    const rootPath = [THEIA_EXT, VSCODE_EXT].includes(hashPathParts[hashPathParts.length - 1])
      ? dirname(window.location.hash.substring(substrNum))
      : window.location.hash.substring(substrNum);

    return new URI(rootPath);
  }

  async getResourcesUri(): Promise<URI> {
    const envVar = await this.envVariablesServer.getValue('THEIA_APP_PROJECT_PATH');
    const applicationPath = envVar && envVar.value ? envVar.value : '';
    return new URI(applicationPath);
  }
}
