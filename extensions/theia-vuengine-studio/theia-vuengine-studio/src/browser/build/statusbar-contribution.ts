import { inject, injectable, interfaces } from "inversify";
import { FrontendApplication, FrontendApplicationContribution, PreferenceService, StatusBar, StatusBarAlignment } from "@theia/core/lib/browser";
import { VesBuildSetModeCommand } from "./commands";
import { VesBuildModePreference } from "./preferences";
import { BuildMode } from "./types";

@injectable()
export class VesBuildStatusBarContribution implements FrontendApplicationContribution {
    @inject(PreferenceService) protected readonly preferenceService: PreferenceService;
    @inject(StatusBar) protected readonly statusBar: StatusBar;

    onStart(app: FrontendApplication) {
        this.updateStatusBar();
    };

    updateStatusBar() {
        this.setBuildModeStatusBar(this.preferenceService.get(VesBuildModePreference.id) as BuildMode);

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
            tooltip: VesBuildSetModeCommand.label,
        });
    }
}

export function bindVesBuildStatusBar(bind: interfaces.Bind): void {
    bind(VesBuildStatusBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesBuildStatusBarContribution);
}
