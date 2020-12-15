import * as electron from "electron";
import * as React from "react";
import { inject, injectable, postConstruct } from "inversify";
import { ReactWidget } from "@theia/core/lib/browser/widgets/react-widget";
import { ElectronCommands } from "@theia/core/lib/electron-browser/menu/electron-menu-contribution";
import { CommandService } from "@theia/core";
import {
  VesMaximizeWindowCommand,
  VesMinimizeWindowCommand,
  VesUnmaximizeWindowCommand,
} from "./commands";

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
    electron.remote.getCurrentWindow().on("maximize", () => this.update());
    electron.remote.getCurrentWindow().on("unmaximize", () => this.update());
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
          ‒
        </div>
        {!this.isMaximized() && (
          <div
            className="topbar-window-controls-button"
            id="ves-topbar-window-controls-maximize"
            onClick={() =>
              this.commandService.executeCommand(VesMaximizeWindowCommand.id)
            }
          >
            ◻
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
            ❐
          </div>
        )}
        <div
          className="topbar-window-controls-button"
          id="ves-topbar-window-controls-close"
          onClick={() =>
            this.commandService.executeCommand(ElectronCommands.CLOSE_WINDOW.id)
          }
        >
          ⨉
        </div>
      </>
    );
  }

  protected isMaximized(): boolean {
    return electron.remote.getCurrentWindow().isMaximized();
  }
}
