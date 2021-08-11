import * as React from '@theia/core/shared/react';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { remote } from '@theia/core/shared/electron'; /* eslint-disable-line */
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { isOSX, isWindows } from '@theia/core';
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
import { VesProjectsService } from '../../projects/browser/ves-projects-service';

@injectable()
export class VesTitlebarApplicationTitleWidget extends ReactWidget {
  @inject(VesProjectsService)
  protected readonly vesProjectsService: VesProjectsService;
  @inject(WorkspaceService)
  private readonly workspaceService: WorkspaceService;

  static readonly ID = 'ves-titlebar-application-title';
  static readonly LABEL = 'Titlebar Action Buttons';
  protected applicationTitle = '';

  @postConstruct()
  protected async init(): Promise<void> {
    this.id = VesTitlebarApplicationTitleWidget.ID;
    this.title.label = VesTitlebarApplicationTitleWidget.LABEL;
    this.title.caption = VesTitlebarApplicationTitleWidget.LABEL;
    this.title.closable = false;
    this.addClass(`os-${this.getOs()}`);

    const { applicationName: title } = FrontendApplicationConfigProvider.get();
    this.applicationTitle = title;

    this.update();

    this.vesProjectsService.onDidChangeProjectFile(() => { this.setTitle(); });
    this.workspaceService.onWorkspaceChanged(() => { this.setTitle(); });
  }

  protected getOs(): string {
    return isWindows ? 'win' : isOSX ? 'osx' : 'linux';
  }

  protected setTitle(): void {
    this.vesProjectsService.getProjectName().then(projectTitle => {
      if (projectTitle !== '') {
        this.applicationTitle = projectTitle;
        this.update();
      }
    });
  }

  protected render(): React.ReactNode {
    this.setTitle();

    return <div onDoubleClick={this.handleDoubleClick}>{this.applicationTitle}</div>;
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
