import { inject, injectable, interfaces } from "inversify";
import { FrontendApplication, FrontendApplicationContribution, PreferenceService, StatusBar, StatusBarAlignment } from "@theia/core/lib/browser";
import { VesStateModel } from "../common/vesStateModel";
import { VesBuildSetModeCommand } from "./commands";
import { VesBuildModePreference } from "./preferences";

@injectable()
export class VesBuildStatusBarContribution implements FrontendApplicationContribution {
    @inject(PreferenceService) protected readonly preferenceService: PreferenceService;
    @inject(StatusBar) protected readonly statusBar: StatusBar;
    @inject(VesStateModel) protected readonly vesState: VesStateModel;

    onStart(app: FrontendApplication) {
        this.updateStatusBar();
    };

    updateStatusBar() {
        this.setBuildModeStatusBar();

        this.vesState.onDidChangeBuildStatus(() => this.setBuildModeStatusBar());
        this.preferenceService.onPreferenceChanged(({ preferenceName, newValue }) => {
            if (preferenceName === VesBuildModePreference.id) {
                this.setBuildModeStatusBar();
            }
        });
    }

    setBuildModeStatusBar() {
        let label = "";
        const command = VesBuildSetModeCommand.id;
        if (this.vesState.buildStatus.active) {
            label = "Building...";
        } else {
            label = this.preferenceService.get(VesBuildModePreference.id) || "Build Mode";
        }
        this.statusBar.setElement("ves-build-mode", {
            alignment: StatusBarAlignment.LEFT,
            command: command,
            priority: 3,
            text: `$(wrench) ${label}`,
            tooltip: VesBuildSetModeCommand.label,
        });
    }
}

export function bindVesBuildStatusBar(bind: interfaces.Bind): void {
    bind(VesBuildStatusBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesBuildStatusBarContribution);
}
