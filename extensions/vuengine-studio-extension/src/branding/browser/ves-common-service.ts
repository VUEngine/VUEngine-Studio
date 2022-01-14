import { Emitter, isOSX, isWindows } from '@theia/core';
import { ApplicationShell, Widget } from '@theia/core/lib/browser';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';

@injectable()
export class VesCommonService {
  @inject(ApplicationShell)
  protected applicationShell: ApplicationShell;
  @inject(EnvVariablesServer)
  protected envVariablesServer: EnvVariablesServer;

  @postConstruct()
  protected async init(): Promise<void> {
    this.applicationShell.mainPanel.onDidToggleMaximized(widget => this.handleToggleMaximized(widget));
    this.applicationShell.bottomPanel.onDidToggleMaximized(widget => this.handleToggleMaximized(widget));
    this.applicationShell.leftPanelHandler.dockPanel.onDidToggleMaximized(widget => this.handleToggleMaximized(widget));
    this.applicationShell.rightPanelHandler.dockPanel.onDidToggleMaximized(widget => this.handleToggleMaximized(widget));
  }

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

  protected handleToggleMaximized(widget: Widget): void {
    this.isMaximized = !this.isMaximized && widget;
  }
}
