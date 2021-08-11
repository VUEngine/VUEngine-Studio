import { remote } from '@theia/core/shared/electron'; /* eslint-disable-line */
import * as React from '@theia/core/shared/react';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { ElectronCommands } from '@theia/core/lib/electron-browser/menu/electron-menu-contribution';
import { CommandService } from '@theia/core';
import { VesTitlebarWindowControlCommands } from './ves-branding-titlebar-window-controls-commands';

@injectable()
export class VesTitlebarWindowControlsWidget extends ReactWidget {
  static readonly ID = 'ves-titlebar-window-controls';
  static readonly LABEL = 'Titlebar Window Controls';

  @inject(CommandService)
  protected readonly commandService!: CommandService;

  @postConstruct()
  protected async init(): Promise<void> {
    this.id = VesTitlebarWindowControlsWidget.ID;
    this.title.label = VesTitlebarWindowControlsWidget.LABEL;
    this.title.caption = VesTitlebarWindowControlsWidget.LABEL;
    this.title.closable = false;
    remote.getCurrentWindow().on('maximize', () => this.update());
    remote.getCurrentWindow().on('unmaximize', () => this.update());
    this.update();
  }

  protected render(): React.ReactNode {
    return (
      <>
        <div
          className='titlebar-window-controls-button minimize'
          id='ves-titlebar-window-controls-minimize'
          onClick={() =>
            this.commandService.executeCommand(VesTitlebarWindowControlCommands.MINIMIZE.id)
          }
        >
          {/* ‒ */}
          <svg width='11' height='11' viewBox='0 0 11 1'>
            <path d='m11 0v1h-11v-1z' strokeWidth='.26208' />
          </svg>
        </div>
        {!this.isMaximized() && (
          <div
            className='titlebar-window-controls-button maximize'
            id='ves-titlebar-window-controls-maximize'
            onClick={() =>
              this.commandService.executeCommand(VesTitlebarWindowControlCommands.MAXIMIZE.id)
            }
          >
            {/* ◻ */}
            <svg width='10' height='10' viewBox='0 0 10 10'>
              <path d='m10-1.6667e-6v10h-10v-10zm-1.001 1.001h-7.998v7.998h7.998z' strokeWidth='.25' />
            </svg>
          </div>
        )}
        {this.isMaximized() && (
          <div
            className='titlebar-window-controls-button restore'
            id='ves-titlebar-window-controls-restore'
            onClick={() =>
              this.commandService.executeCommand(VesTitlebarWindowControlCommands.UNMAXIMIZE.id)
            }
          >
            {/* ❐ */}
            <svg width='11' height='11' viewBox='0 0 11 11'>
              <path
                d='m11 8.7978h-2.2021v2.2022h-8.7979v-8.7978h2.2021v-2.2022h8.7979zm-3.2979-5.5h-6.6012v6.6011h6.6012zm2.1968-2.1968h-6.6012v1.1011h5.5v5.5h1.1011z'
                strokeWidth='.275'
              />
            </svg>
          </div>
        )}
        <div
          className='titlebar-window-controls-button close'
          id='ves-titlebar-window-controls-close'
          onClick={() =>
            this.commandService.executeCommand(ElectronCommands.CLOSE_WINDOW.id)
          }
        >
          {/* ⨉ */}
          <svg width='12' height='12' viewBox='0 0 12 12'>
            <path
              /* eslint-disable-next-line */
              d='m6.8496 6 5.1504 5.1504-0.84961 0.84961-5.1504-5.1504-5.1504 5.1504-0.84961-0.84961 5.1504-5.1504-5.1504-5.1504 0.84961-0.84961 5.1504 5.1504 5.1504-5.1504 0.84961 0.84961z'
              strokeWidth='.3'
            />
          </svg>
        </div>
      </>
    );
  }

  protected isMaximized(): boolean {
    return remote.getCurrentWindow().isMaximized();
  }
}
