import { CommandService } from '@theia/core';
import { getCurrentWindow, systemPreferences } from '@theia/core/electron-shared/@electron/remote';
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { WorkspaceCommands, WorkspaceService } from '@theia/workspace/lib/browser';
import { VesProjectService } from '../../../project/browser/ves-project-service';

@injectable()
export class VesTitlebarApplicationTitleWidget extends ReactWidget {
  @inject(CommandService)
  protected readonly commandService: CommandService;
  @inject(VesProjectService)
  protected readonly vesProjectsService: VesProjectService;
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

    const { applicationName: title } = FrontendApplicationConfigProvider.get();
    this.applicationTitle = title;
    this.update();

    await this.workspaceService.ready;
    await this.setTitle();

    this.vesProjectsService.onDidChangeProjectData(async () => {
      await this.setTitle();
    });
    this.workspaceService.onWorkspaceChanged(async () => {
      await this.setTitle();
    });
  }

  protected async setTitle(): Promise<void> {
    this.applicationTitle = await this.vesProjectsService.getProjectName();
    this.update();
  }

  protected render(): React.ReactNode {
    return <div onDoubleClick={this.maximizeWindow}>
      <div className="applicationTitle" onClick={this.openRecentWorkspace}>
        {this.applicationTitle}
      </div >
    </div>;
  }

  protected maximizeWindow(): void {
    const win = getCurrentWindow();
    if (!win) { return; }
    if (process.platform === 'darwin') {
      const action = systemPreferences.getUserDefault('AppleActionOnDoubleClick', 'string');
      if (action === 'None') { return; }
      if (action === 'Minimize') { return win.minimize(); }
    }
    if (win.isMaximized()) { return win.unmaximize(); };
    return win.maximize();
  }

  protected openRecentWorkspace = async () => this.commandService.executeCommand(WorkspaceCommands.OPEN_RECENT_WORKSPACE.id);
}