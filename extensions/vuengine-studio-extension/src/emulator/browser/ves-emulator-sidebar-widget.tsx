import { CommandService, nls } from '@theia/core';
import { PreferenceService } from '@theia/core/lib/browser';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { Message } from '@theia/core/shared/@phosphor/messaging';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import NoWorkspaceOpened from '../../core/browser/components/NoWorkspaceOpened';
import { VesWorkspaceService } from '../../core/browser/ves-workspace-service';
import EmulatorSidebar from './components/EmulatorSidebar';
import { VesEmulatorService } from './ves-emulator-service';

@injectable()
export class VesEmulatorSidebarWidget extends ReactWidget {
  @inject(CommandService)
  private readonly commandService: CommandService;
  @inject(FileService)
  private readonly fileService: FileService;
  @inject(FileDialogService)
  private readonly fileDialogService: FileDialogService;
  @inject(PreferenceService)
  private readonly preferenceService: PreferenceService;
  @inject(VesEmulatorService)
  private readonly vesEmulatorService: VesEmulatorService;
  @inject(VesWorkspaceService)
  private readonly workspaceService: VesWorkspaceService;

  static readonly ID = 'vesEmulatorSidebarWidget';
  static readonly LABEL = nls.localize('vuengine/emulator/emulator', 'Emulator');

  protected state = {
    showLog: [] as boolean[],
  };

  @postConstruct()
  protected init(): void {
    this.id = VesEmulatorSidebarWidget.ID;
    this.title.iconClass = 'codicon codicon-run-all';
    this.title.closable = true;
    this.bindEvents();
    this.setTitle();
    this.update();
  }

  protected bindEvents(): void {
    this.workspaceService.onDidChangeRoots((isCollaboration: boolean) => {
      if (isCollaboration) {
        this.update();
      }
    });

    this.vesEmulatorService.onDidChangeIsQueued(isQueued => {
      this.title.className = isQueued ? 'ves-decorator-queued' : '';
      this.update();
    });
  }

  protected setTitle(): void {
    this.title.label = VesEmulatorSidebarWidget.LABEL;
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
      : <EmulatorSidebar
        isQueued={this.vesEmulatorService.isQueued}
        commandService={this.commandService}
        fileService={this.fileService}
        fileDialogService={this.fileDialogService}
        preferenceService={this.preferenceService}
      />;
  }
}
