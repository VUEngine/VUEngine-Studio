import { inject, injectable, interfaces } from "inversify";
import { FrontendApplication, FrontendApplicationContribution, PreferenceService, StatusBar, StatusBarAlignment } from "@theia/core/lib/browser";
import { VesState } from "../common/ves-state";
import { VesBuildCommands } from "./build-commands";
import { VesBuildPrefs } from "./build-preferences";

@injectable()
export class VesBuildStatusBarContribution implements FrontendApplicationContribution {
    @inject(PreferenceService) protected readonly preferenceService: PreferenceService;
    @inject(StatusBar) protected readonly statusBar: StatusBar;
    @inject(VesState) protected readonly vesState: VesState;

    onStart(app: FrontendApplication) {
        this.updateStatusBar();
    };

    updateStatusBar() {
        this.setBuildModeStatusBar();

        this.vesState.onDidChangeBuildStatus(() => this.setBuildModeStatusBar());
        this.preferenceService.onPreferenceChanged(({ preferenceName, newValue }) => {
            if (preferenceName === VesBuildPrefs.BUILD_MODE.id) {
                this.setBuildModeStatusBar();
            }
        });
    }

    setBuildModeStatusBar() {
        let label = this.preferenceService.get(VesBuildPrefs.BUILD_MODE.id) || "Build Mode";;
        let command = VesBuildCommands.SET_MODE.id;
        if (this.vesState.buildStatus.active) {
            label = `${this.vesState.buildStatus.step}... ${this.vesState.buildStatus.progress}%`;
            command = VesBuildCommands.OPEN_WIDGET.id;
        }
        this.statusBar.setElement("ves-build-mode", {
            alignment: StatusBarAlignment.LEFT,
            command: command,
            priority: 3,
            text: `$(wrench) ${label}`,
            tooltip: VesBuildCommands.SET_MODE.label,
        });
    }
}

export function bindVesBuildStatusBar(bind: interfaces.Bind): void {
    bind(VesBuildStatusBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesBuildStatusBarContribution);
}
