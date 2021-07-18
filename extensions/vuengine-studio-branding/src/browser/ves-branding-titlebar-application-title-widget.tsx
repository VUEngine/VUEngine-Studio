import * as React from 'react';
import { inject, injectable, postConstruct } from 'inversify';
import { remote } from 'electron'; /* eslint-disable-line */
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { isOSX, isWindows } from '@theia/core';

@injectable()
export class VesTitlebarApplicationTitleWidget extends ReactWidget {
  @inject(WorkspaceService)
  private readonly workspaceService: WorkspaceService;

  static readonly ID = 'ves-titlebar-application-title';
  static readonly LABEL = 'Titlebar Action Buttons';

  @postConstruct()
  protected async init(): Promise<void> {
    this.id = VesTitlebarApplicationTitleWidget.ID;
    this.title.label = VesTitlebarApplicationTitleWidget.LABEL;
    this.title.caption = VesTitlebarApplicationTitleWidget.LABEL;
    this.title.closable = false;
    this.addClass(`os-${this.getOs()}`);
    this.update();

    this.workspaceService.onWorkspaceChanged(() => this.update());
  }

  protected getOs(): string {
    return isWindows ? 'win' : isOSX ? 'osx' : 'linux';
  }

  protected render(): React.ReactNode {
    let { applicationName: title } = FrontendApplicationConfigProvider.get();
    const workspace = this.workspaceService.workspace;
    if (workspace !== undefined) {
      // TODO: attempt to retrieve project name from configuration file, use below as fallback
      if (this.workspaceService.workspace?.isFile) {
        const workspaceParts = workspace.name.split('.');
        workspaceParts.pop();
        title = `${workspaceParts.join('.')} (Workspace)`;
      } else {
        title = workspace.name;
      }
    }
    return <div onDoubleClick={this.handleDoubleClick}>{title}</div>;
  }

  protected handleDoubleClick(): void {
    const win = remote.getCurrentWindow();
    if (!win) { return; }
    if (process.platform === 'darwin') {
      const action = remote.systemPreferences.getUserDefault('AppleActionOnDoubleClick', 'string');
      if (action === 'None') { return; }
      if (action === 'Minimize') { return win.minimize(); }
    }
    if (win.isMaximized()) { return win.unmaximize(); };
    return win.maximize();
  }
}
