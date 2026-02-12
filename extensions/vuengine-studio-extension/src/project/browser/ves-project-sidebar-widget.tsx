import { CommandService, nls } from '@theia/core';
import { OpenerService } from '@theia/core/lib/browser';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { Message } from '@theia/core/shared/@lumino/messaging';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import NoWorkspaceOpened from '../../core/browser/components/NoWorkspaceOpened';
import { VesWorkspaceService } from '../../core/browser/ves-workspace-service';
import { VesProjectService } from './ves-project-service';
import ProjectSettings from './components/ProjectSidebar/ProjectSettings';

@injectable()
export class VesProjectSidebarWidget extends ReactWidget {
  @inject(CommandService)
  private readonly commandService: CommandService;
  @inject(FileService)
  private readonly fileService: FileService;
  @inject(OpenerService)
  private readonly openerService: OpenerService;
  @inject(VesProjectService)
  private readonly vesProjectService: VesProjectService;
  @inject(VesWorkspaceService)
  private readonly workspaceService: VesWorkspaceService;

  static readonly ID = 'vesProjectSidebarWidget';
  static readonly LABEL = nls.localize('vuengine/projects/project', 'Project');

  @postConstruct()
  protected init(): void {
    this.id = VesProjectSidebarWidget.ID;
    this.title.iconClass = 'codicon codicon-repo';
    this.title.closable = false;
    this.node.style.outline = 'none';
    this.bindEvents();
    this.setTitle();
    this.update();
    this.render();
  }

  protected bindEvents(): void {
    this.workspaceService.onDidChangeRoots((isCollaboration: boolean) => {
      if (isCollaboration) {
        this.update();
      }
    });
  }

  protected setTitle(): void {
    this.title.label = VesProjectSidebarWidget.LABEL;
    this.title.caption = this.title.label;
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.node.tabIndex = 0;
    this.node.focus();
  }

  protected render(): React.ReactNode {
    return !this.workspaceService.opened
      ? <NoWorkspaceOpened
        commandService={this.commandService}
      />
      : <ProjectSettings
        fileService={this.fileService}
        openerService={this.openerService}
        vesProjectService={this.vesProjectService}
        workspaceService={this.workspaceService}
      />;
  }
}
