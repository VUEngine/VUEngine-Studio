import { CommandService, nls, PreferenceService } from '@theia/core';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { Message } from '@lumino/messaging';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from 'react';
import NoWorkspaceOpened from '../../core/browser/components/NoWorkspaceOpened';
import { VesWorkspaceService } from '../../core/browser/ves-workspace-service';
import EmulatorSidebar from './components/EmulatorSidebar';
import { VesEmulatorService } from './ves-emulator-service';

@injectable()
export class VesEmulatorSidebarWidget extends ReactWidget {
  @inject(CommandService)
  private readonly commandService: CommandService;
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
    this.title.closable = false;
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
        preferenceService={this.preferenceService}
      />;
  }
}
