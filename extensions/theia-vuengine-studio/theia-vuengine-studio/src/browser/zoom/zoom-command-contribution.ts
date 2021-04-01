import { inject, injectable, interfaces, postConstruct } from "inversify";
import { remote } from "electron";
import { CommandContribution, CommandRegistry } from "@theia/core/lib/common";
import { ElectronCommands } from "@theia/core/lib/electron-browser/menu/electron-menu-contribution";
import { VesZoomCommands } from "./zoom-commands";
import { VesZoomStatusBarContribution } from "./zoom-statusbar-contribution";
import { VesZoomPreferences } from "./zoom-preferences";
import { PreferenceScope, PreferenceService } from "@theia/core/lib/browser";
import { FrontendApplicationState, FrontendApplicationStateService } from "@theia/core/lib/browser/frontend-application-state";

@injectable()
export class VesZoomCommandContribution implements CommandContribution {
  @inject(FrontendApplicationStateService) protected readonly frontendApplicationStateService: FrontendApplicationStateService;
  @inject(PreferenceService) protected readonly preferenceService: PreferenceService;
  @inject(VesZoomStatusBarContribution) protected readonly vesZoomStatusBarContribution: VesZoomStatusBarContribution;

  @postConstruct()
  protected async init(): Promise<void> {
    this.frontendApplicationStateService.onStateChanged(async (state: FrontendApplicationState) => {
      if (state === 'ready') {
        this.applyConfiguredZoomFactor();
        this.vesZoomStatusBarContribution.updateStatusBar();

        this.preferenceService.onPreferenceChanged(({ preferenceName, newValue }) => {
          if (preferenceName === VesZoomPreferences.ZOOM_FACTOR.id) {
            this.applyConfiguredZoomFactor();
          }
        });
      }
    });
  }

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.unregisterCommand(ElectronCommands.ZOOM_IN);
    commandRegistry.registerCommand(VesZoomCommands.ZOOM_IN, {
      execute: () => this.changeZoomFactor(1)
    });

    commandRegistry.unregisterCommand(ElectronCommands.ZOOM_OUT);
    commandRegistry.registerCommand(VesZoomCommands.ZOOM_OUT, {
      execute: () => this.changeZoomFactor(-1)
    });

    commandRegistry.unregisterCommand(ElectronCommands.RESET_ZOOM);
    commandRegistry.registerCommand(VesZoomCommands.RESET_ZOOM, {
      execute: () => this.setDefaultZoomFactor()
    });
  }

  setDefaultZoomFactor() {
    this.setZoomFactor(1);
  }

  changeZoomFactor(direction: -1 | 1) {
    // @ts-ignore
    const zoomFactors = VesZoomPreferences.ZOOM_FACTOR.property.enum.map((value) => { return this.toZoomFactor(value) });
    let newZoomFactor = this.toZoomFactor(this.preferenceService.get(VesZoomPreferences.ZOOM_FACTOR.id) as string);

    for (let index = 0; index < zoomFactors.length; index++) {
      if (newZoomFactor === zoomFactors[index] && zoomFactors[index + direction]) {
        newZoomFactor = zoomFactors[index + direction];
        break;
      }
    }

    this.setZoomFactor(newZoomFactor);
  }

  setZoomFactor(zoomFactor: number) {
    const currentWindow = remote.getCurrentWindow();
    currentWindow.webContents.setZoomFactor(zoomFactor);

    this.preferenceService.set(
      VesZoomPreferences.ZOOM_FACTOR.id,
      this.fromZoomFactor(zoomFactor),
      PreferenceScope.User
    );
  }

  applyConfiguredZoomFactor() {
    const currentZoomFactor = this.toZoomFactor(this.preferenceService.get(VesZoomPreferences.ZOOM_FACTOR.id) as string);
    this.setZoomFactor(currentZoomFactor);
  }

  toZoomFactor(value: string): number {
    return parseInt(value.slice(0, -1)) / 100;
  };

  fromZoomFactor(value: number): string {
    return value * 100 + "%";
  };
}

export function bindVesZoomCommands(bind: interfaces.Bind): void {
  bind(CommandContribution).to(VesZoomCommandContribution).inSingletonScope();
}