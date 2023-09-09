import { CommandService, isOSX } from '@theia/core';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { WindowTitleService } from '@theia/core/lib/browser/window/window-title-service';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { WorkspaceCommands, WorkspaceService } from '@theia/workspace/lib/browser';

@injectable()
export class VesTitlebarApplicationTitleWidget extends ReactWidget {
  @inject(CommandService)
  protected readonly commandService: CommandService;
  @inject(WindowTitleService)
  private readonly windowTitleService: WindowTitleService;
  @inject(WorkspaceService)
  private readonly workspaceService: WorkspaceService;

  static readonly ID = 'ves-titlebar-application-title';
  static readonly LABEL = 'Titlebar Action Buttons';
  protected applicationTitle = '';

  @postConstruct()
  protected init(): void {
    this.doInit();

    this.id = VesTitlebarApplicationTitleWidget.ID;
    this.title.label = VesTitlebarApplicationTitleWidget.LABEL;
    this.title.caption = VesTitlebarApplicationTitleWidget.LABEL;
    this.title.closable = false;

    this.windowTitleService.onDidChangeTitle(() => {
      this.setTitle();
    });
  }

  protected async doInit(): Promise<void> {
    await this.workspaceService.ready;
    this.setTitle();

    this.update();
  }

  protected setTitle(): void {
    this.applicationTitle = this.windowTitleService.title;
    this.update();
  }

  protected render(): React.ReactNode {
    return <div onDoubleClick={this.maximizeWindow}>
      <div className="applicationTitle" onClick={this.openRecentWorkspace}>
        {this.applicationTitle}
      </div>
    </div>;
  }

  protected maximizeWindow(): void {
    const win = window.electronTheiaCore;
    if (!win) { return; }
    if (isOSX) {
      const action = window.electronVesCore.getUserDefault('AppleActionOnDoubleClick', 'string');
      if (action === 'None') { return; }
      if (action === 'Minimize') { return win.minimize(); }
      win.minimize();
    }
    if (win.isMaximized()) { return win.unMaximize(); };
    return win.maximize();
  }

  protected openRecentWorkspace = async () => this.commandService.executeCommand(WorkspaceCommands.OPEN_RECENT_WORKSPACE.id);
}
