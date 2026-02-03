import { CommandService, isOSX } from '@theia/core';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { WindowTitleService } from '@theia/core/lib/browser/window/window-title-service';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { WorkspaceCommands } from '@theia/workspace/lib/browser';
import { VesCommonService } from '../../../core/browser/ves-common-service';
import { VesWorkspaceService } from '../../../core/browser/ves-workspace-service';

@injectable()
export class VesTitlebarApplicationTitleWidget extends ReactWidget {
  @inject(CommandService)
  protected readonly commandService: CommandService;
  @inject(WindowTitleService)
  private readonly windowTitleService: WindowTitleService;
  @inject(VesCommonService)
  private readonly vesCommonService: VesCommonService;
  @inject(VesWorkspaceService)
  private readonly workspaceService: VesWorkspaceService;

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
      <div
        className="applicationTitle"
        onClick={this.openRecentWorkspace}
        title={WorkspaceCommands.OPEN_RECENT_WORKSPACE.label +
          this.vesCommonService.getKeybindingLabel(WorkspaceCommands.OPEN_RECENT_WORKSPACE.id, true)
        }
      >
        {this.workspaceService.isCollaboration() && <>
          <i className="codicon codicon-broadcast"></i>
        </>}
        {this.applicationTitle}
        {this.workspaceService.opened &&
          <div
            className="closeButton"
            onClick={this.closeWorkspace}
            title={WorkspaceCommands.CLOSE.label +
              this.vesCommonService.getKeybindingLabel(WorkspaceCommands.CLOSE.id, true)
            }
          >
            <i className="codicon codicon-close" />
          </div>
        }
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
  protected closeWorkspace = async () => this.commandService.executeCommand(WorkspaceCommands.CLOSE.id);
}
