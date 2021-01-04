import { inject, injectable, interfaces } from "inversify";
import { remote } from "electron";
import { CommandContribution, CommandRegistry } from "@theia/core/lib/common";
import { ElectronCommands } from "@theia/core/lib/electron-browser/menu/electron-menu-contribution";
import { VesZoomCommands } from "./commands";
import { VesZoomStatusBarContribution } from "./statusbar-contribution";

@injectable()
export class VesZoomCommandContribution implements CommandContribution {
  @inject(VesZoomStatusBarContribution) protected readonly vesZoomStatusBarContribution: VesZoomStatusBarContribution;

  registerCommands(commandRegistry: CommandRegistry): void {
    const currentWindow = remote.getCurrentWindow();

    commandRegistry.unregisterCommand(ElectronCommands.ZOOM_IN);
    commandRegistry.registerCommand(VesZoomCommands.ZOOM_IN, {
      execute: () => {
        const webContents = currentWindow.webContents;
        webContents.setZoomFactor(this.findNextZoomFactor(+webContents.zoomFactor.toFixed(2), 1));
        // TODO: Use events instead of directly accessing updateStatusBar()
        this.vesZoomStatusBarContribution.updateStatusBar();
      }
    });

    commandRegistry.unregisterCommand(ElectronCommands.ZOOM_OUT);
    commandRegistry.registerCommand(VesZoomCommands.ZOOM_OUT, {
      execute: () => {
        const webContents = currentWindow.webContents;
        webContents.setZoomFactor(this.findNextZoomFactor(+webContents.zoomFactor.toFixed(2), -1));
        this.vesZoomStatusBarContribution.updateStatusBar();
      }
    });

    commandRegistry.unregisterCommand(ElectronCommands.RESET_ZOOM);
    commandRegistry.registerCommand(VesZoomCommands.RESET_ZOOM, {
      execute: () => {
        currentWindow.webContents.setZoomFactor(1);
        this.vesZoomStatusBarContribution.updateStatusBar();
      }
    });
  }

  findNextZoomFactor(currentZoomFactor: number, direction: 1 | -1): number {
    const zoomFactors = [
      0.3, 0.5, 0.66, 0.8, 0.9, 1, 1.1, 1.2, 1.33, 1.5, 1.7, 2, 2.4, 3,
    ]
    let newZoomFactor = currentZoomFactor;

    for (let index = 0; index < zoomFactors.length; index++) {
      if (currentZoomFactor === zoomFactors[index] && zoomFactors[index + direction]) {
        newZoomFactor = zoomFactors[index + direction];
        break;
      }
    }

    return newZoomFactor;
  }
}

export function bindVesZoomCommands(bind: interfaces.Bind): void {
  bind(CommandContribution).to(VesZoomCommandContribution).inSingletonScope();
}