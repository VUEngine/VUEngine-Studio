import { remote } from "electron";
import * as React from "react";
import { inject, injectable, postConstruct } from "inversify";
import { ReactWidget } from "@theia/core/lib/browser/widgets/react-widget";
import { ElectronCommands } from "@theia/core/lib/electron-browser/menu/electron-menu-contribution";
import { CommandService } from "@theia/core";
import {
  VesMaximizeWindowCommand,
  VesMinimizeWindowCommand,
  VesUnmaximizeWindowCommand,
} from "./window-controls-commands";

@injectable()
export class VesTopbarWindowControlsWidget extends ReactWidget {
  static readonly ID = "ves-topbar-window-controls";
  static readonly LABEL = "Topbar Window Controls";

  @inject(CommandService)
  protected readonly commandService!: CommandService;

  @postConstruct()
  protected async init(): Promise<void> {
    this.id = VesTopbarWindowControlsWidget.ID;
    this.title.label = VesTopbarWindowControlsWidget.LABEL;
    this.title.caption = VesTopbarWindowControlsWidget.LABEL;
    this.title.closable = false;
    remote.getCurrentWindow().on("maximize", () => this.update());
    remote.getCurrentWindow().on("unmaximize", () => this.update());
    this.update();
  }

  protected render(): React.ReactNode {
    return (
      <>
        <div className="topbar-window-controls-separator"></div>
        <div
          className="topbar-window-controls-button"
          id="ves-topbar-window-controls-minimize"
          onClick={() =>
            this.commandService.executeCommand(VesMinimizeWindowCommand.id)
          }
        >
          {/*‒*/}
          <svg width="11" height="11" viewBox="0 0 11 1">
            <path d="m11 0v1h-11v-1z" strokeWidth=".26208" />
          </svg>
        </div>
        {!this.isMaximized() && (
          <div
            className="topbar-window-controls-button"
            id="ves-topbar-window-controls-maximize"
            onClick={() =>
              this.commandService.executeCommand(VesMaximizeWindowCommand.id)
            }
          >
            {/*◻*/}
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="m10-1.6667e-6v10h-10v-10zm-1.001 1.001h-7.998v7.998h7.998z" strokeWidth=".25" />
            </svg>
          </div>
        )}
        {this.isMaximized() && (
          <div
            className="topbar-window-controls-button"
            id="ves-topbar-window-controls-restore"
            onClick={() =>
              this.commandService.executeCommand(VesUnmaximizeWindowCommand.id)
            }
          >
            {/*❐*/}
            <svg width="11" height="11" viewBox="0 0 11 11">
              <path d="m11 8.7978h-2.2021v2.2022h-8.7979v-8.7978h2.2021v-2.2022h8.7979zm-3.2979-5.5h-6.6012v6.6011h6.6012zm2.1968-2.1968h-6.6012v1.1011h5.5v5.5h1.1011z" strokeWidth=".275" />
            </svg>
          </div>
        )}
        <div
          className="topbar-window-controls-button"
          id="ves-topbar-window-controls-close"
          onClick={() =>
            this.commandService.executeCommand(ElectronCommands.CLOSE_WINDOW.id)
          }
        >
          {/*⨉*/}
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="m6.8496 6 5.1504 5.1504-0.84961 0.84961-5.1504-5.1504-5.1504 5.1504-0.84961-0.84961 5.1504-5.1504-5.1504-5.1504 0.84961-0.84961 5.1504 5.1504 5.1504-5.1504 0.84961 0.84961z" strokeWidth=".3" />
          </svg>
        </div>
      </>
    );
  }

  protected isMaximized(): boolean {
    return remote.getCurrentWindow().isMaximized();
  }
}
