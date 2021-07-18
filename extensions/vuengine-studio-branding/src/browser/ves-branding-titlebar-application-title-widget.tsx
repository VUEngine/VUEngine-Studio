import * as React from 'react';
import { inject, injectable, postConstruct } from 'inversify';
import { dirname, join as joinPath } from 'path';
import { remote } from 'electron'; /* eslint-disable-line */
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { isOSX, isWindows } from '@theia/core';
import URI from '@theia/core/lib/common/uri';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';

@injectable()
export class VesTitlebarApplicationTitleWidget extends ReactWidget {
  @inject(FileService)
  private readonly fileService: FileService;
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
    this.applicationTitle = '';

    // Attempt to retrieve project name from configuration file
    const projectFileUri = new URI(
      joinPath(
        this.getWorkspaceRoot(),
        '.vuengine',
        'project.json'
      )
    );
    if (await this.fileService.exists(projectFileUri)) {
      const configFileContents = await this.fileService.readFile(projectFileUri);
      const projectData = JSON.parse(configFileContents.value.toString());
      if (projectData.name) {
        this.applicationTitle = `${projectData.name} (Project)`;
      }
    };

    this.update();

    this.workspaceService.onWorkspaceChanged(() => this.update());
  }

  protected getOs(): string {
    return isWindows ? 'win' : isOSX ? 'osx' : 'linux';
  }

  protected render(): React.ReactNode {
    let { applicationName: title } = FrontendApplicationConfigProvider.get();
    if (this.applicationTitle === '') {
      const workspace = this.workspaceService.workspace;
      if (workspace !== undefined) {
        if (this.workspaceService.workspace?.isFile) {
          const workspaceParts = workspace.name.split('.');
          workspaceParts.pop();
          title = `${workspaceParts.join('.')} (Workspace)`;
        } else {
          title = workspace.name;
        }
      }
    } else {
      title = this.applicationTitle;
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

  getWorkspaceRoot(): string {
    const substrNum = isWindows ? 2 : 1;

    return window.location.hash.slice(-9) === 'workspace'
      ? dirname(window.location.hash.substring(substrNum))
      : window.location.hash.substring(substrNum);
  }
}
