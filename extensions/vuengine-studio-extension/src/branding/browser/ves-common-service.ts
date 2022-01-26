import { Emitter, isOSX, isWindows } from '@theia/core';
import { ApplicationShell, Widget } from '@theia/core/lib/browser';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { VesProcessWatcher } from '../../process/browser/ves-process-service-watcher';
import { VesProcessService, VesProcessType } from '../../process/common/ves-process-service-protocol';

@injectable()
export class VesCommonService {
  @inject(ApplicationShell)
  protected applicationShell: ApplicationShell;
  @inject(EnvVariablesServer)
  protected envVariablesServer: EnvVariablesServer;
  @inject(VesProcessService)
  protected readonly vesProcessService: VesProcessService;
  @inject(VesProcessWatcher)
  protected readonly vesProcessWatcher: VesProcessWatcher;

  @postConstruct()
  protected async init(): Promise<void> {
    await this.determineIsWslInstalled();

    this.applicationShell.mainPanel.onDidToggleMaximized(widget => this.handleToggleMaximized(widget));
    this.applicationShell.bottomPanel.onDidToggleMaximized(widget => this.handleToggleMaximized(widget));
    this.applicationShell.leftPanelHandler.dockPanel.onDidToggleMaximized(widget => this.handleToggleMaximized(widget));
    this.applicationShell.rightPanelHandler.dockPanel.onDidToggleMaximized(widget => this.handleToggleMaximized(widget));
  }

  isWslInstalled: boolean = false;

  protected _isMaximized: Widget | false = false;
  protected readonly onDidChangeIsMaximizedEmitter = new Emitter<Widget | false>();
  readonly onDidChangeIsMaximized = this.onDidChangeIsMaximizedEmitter.event;
  set isMaximized(flag: Widget | false) {
    this._isMaximized = flag;
    this.onDidChangeIsMaximizedEmitter.fire(this._isMaximized);
  }
  get isMaximized(): Widget | false {
    return this._isMaximized;
  }

  getOs(): string {
    return isWindows ? 'win' : isOSX ? 'osx' : 'linux';
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

  protected handleToggleMaximized(widget: Widget): void {
    this.isMaximized = !this.isMaximized && widget;
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
