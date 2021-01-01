import { inject, injectable, interfaces } from "inversify";
import { FrontendApplication, FrontendApplicationContribution, PreferenceService, StatusBar, StatusBarAlignment } from "@theia/core/lib/browser";
import { VesBuildSetModeCommand } from "./commands";
import { VesBuildModePreference } from "./preferences";

@injectable()
export class VesBuildStatusBarContribution implements FrontendApplicationContribution {
    @inject(PreferenceService) protected readonly preferenceService: PreferenceService;
    @inject(StatusBar) protected readonly statusBar: StatusBar;

    onStart(app: FrontendApplication) {
        this.updateStatusBar();
    };

    updateStatusBar() {
        this.preferenceService.onPreferenceChanged(({ preferenceName, newValue }) => {
            if (preferenceName === VesBuildModePreference.id) {
                this.setBuildModeStatusBar(newValue);
            }
        });
    }

    setBuildModeStatusBar(name: string) {
        this.statusBar.setElement("ves-build-mode", {
            alignment: StatusBarAlignment.LEFT,
            command: VesBuildSetModeCommand.id,
            priority: 3,
            text: `$(wrench) ${name}`,
            tooltip: "Select Build Mode"
        });
    }
}

export function bindVesBuildStatusBar(bind: interfaces.Bind): void {
    bind(VesBuildStatusBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesBuildStatusBarContribution);
}
