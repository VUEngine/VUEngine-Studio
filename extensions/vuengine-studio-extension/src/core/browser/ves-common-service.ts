import { isOSX, isWindows } from '@theia/core';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { customAlphabet } from 'nanoid';
import { VesProcessWatcher } from '../../process/browser/ves-process-service-watcher';
import { VesProcessService, VesProcessType } from '../../process/common/ves-process-service-protocol';

@injectable()
export class VesCommonService {
  @inject(EnvVariablesServer)
  protected envVariablesServer: EnvVariablesServer;
  @inject(VesProcessService)
  protected readonly vesProcessService: VesProcessService;
  @inject(VesProcessWatcher)
  protected readonly vesProcessWatcher: VesProcessWatcher;

  @postConstruct()
  protected async init(): Promise<void> {
    await this.determineIsWslInstalled();
  }

  isWslInstalled: boolean = false;

  getOs(): string {
    return isWindows ? 'win' : isOSX ? 'osx' : 'linux';
  }

  nanoid(): string {
    const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 16);
    return nanoid();
  }

  async getResourcesUri(): Promise<URI> {
    const envVar = await this.envVariablesServer.getValue('THEIA_APP_PROJECT_PATH');
    const applicationPath = envVar && envVar.value
      ? isWindows
        ? `/${envVar.value}`
        : envVar.value
      : '';

    return new URI(applicationPath).withScheme('file');
  }

  formatPath(path: string): string {
    return isWindows
      ? path.replace(/\//g, '\\') // replace slashes with backslashes
        .replace(/^\/|\/$/g, '') // remove leading and trailing slashes
        .replace(/^\\|\\$/g, '') // remove leading and trailing backslashes
        .replace(/^[a-z]:\\/, x => x.toUpperCase()) // uppercase drive number
      : path;
  }

  protected async determineIsWslInstalled(): Promise<void> {
    if (!isWindows) {
      this.isWslInstalled = false;
      return;
    }

    const checkProcess = await this.vesProcessService.launchProcess(VesProcessType.Raw, {
      command: 'wsl.exe',
      args: ['--list', '--verbose']
    });

    await new Promise<void>((resolve, reject) => {
      this.vesProcessWatcher.onDidReceiveOutputStreamData(({ pId, data }) => {
        if (checkProcess.processManagerId === pId) {
          data = data.replace(/\0/g, ''); // clean of NUL characters
          this.isWslInstalled = data.includes('NAME') && data.includes('STATE') && data.includes('VERSION');
          resolve();
        }
      });
      this.vesProcessWatcher.onDidExitProcess(({ pId }) => {
        if (checkProcess.processManagerId === pId) {
          resolve();
        }
      });
    });
  }
}
