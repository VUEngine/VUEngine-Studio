import { CommandService, nls } from '@theia/core';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { Message } from '@theia/core/shared/@phosphor/messaging';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { VesEmulatorCommands } from './ves-emulator-commands';
import { VesEmulatorService } from './ves-emulator-service';

@injectable()
export class VesEmulatorSidebarWidget extends ReactWidget {
  @inject(CommandService)
  private readonly commandService: CommandService;
  @inject(VesEmulatorService)
  private readonly vesEmulatorService: VesEmulatorService;

  static readonly ID = 'vesEmulatorSidebarWidget';
  static readonly LABEL = nls.localize('vuengine/emulator/emulator', 'Emulator');

  protected state = {
    showLog: [] as boolean[],
  };

  @postConstruct()
  protected async init(): Promise<void> {
    this.id = VesEmulatorSidebarWidget.ID;
    this.title.iconClass = 'codicon codicon-run';
    this.title.closable = true;
    this.setTitle();
    this.node.tabIndex = 0; // required for this.node.focus() to work in this.onActivateRequest()
    this.update();

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
    this.node.focus();
  }

  protected render(): React.ReactNode {
    return <>
      <button className='theia-button large full-width' onClick={this.run}>Run</button>
    </>;
  }

  protected run = () => this.commandService.executeCommand(VesEmulatorCommands.RUN.id);
}
