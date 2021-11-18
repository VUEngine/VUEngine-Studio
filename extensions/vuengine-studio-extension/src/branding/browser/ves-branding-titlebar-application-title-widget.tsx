import * as React from '@theia/core/shared/react';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { remote } from '@theia/core/shared/electron';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { WorkspaceCommands, WorkspaceService } from '@theia/workspace/lib/browser';
import { CommandService } from '@theia/core';
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
import { VesProjectsService } from '../../projects/browser/ves-projects-service';
import { VesCommonService } from './ves-common-service';

@injectable()
export class VesTitlebarApplicationTitleWidget extends ReactWidget {
  @inject(CommandService)
  protected readonly commandService: CommandService;
  @inject(VesCommonService)
  protected readonly vesCommonService: VesCommonService;
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
    this.addClass(`os-${this.vesCommonService.getOs()}`);

    const { applicationName: title } = FrontendApplicationConfigProvider.get();
    this.applicationTitle = title;

    await this.workspaceService.ready;
    await this.setTitle();

    this.vesProjectsService.onDidChangeProjectFile(async () => {
      await this.setTitle();
    });
    this.workspaceService.onWorkspaceChanged(async () => {
      await this.setTitle();
    });
  }

  protected async setTitle(): Promise<void> {
    const projectTitle = await this.vesProjectsService.getProjectName();
    if (projectTitle !== '') {
      this.applicationTitle = projectTitle;
      this.update();
    }
  }

  protected render(): React.ReactNode {
    return <div onDoubleClick={this.maximizeWindow}>
      <div className="applicationTitle" onClick={this.openRecentWorkspace}>
        {this.applicationTitle}
      </div >
    </div>;
  }

  protected maximizeWindow(): void {
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

  protected openRecentWorkspace = async () => this.commandService.executeCommand(WorkspaceCommands.OPEN_RECENT_WORKSPACE.id);
}
