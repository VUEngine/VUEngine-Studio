import { inject, injectable, interfaces } from "inversify";
import { FrontendApplication, FrontendApplicationContribution, PreferenceService, StatusBar, StatusBarAlignment } from "@theia/core/lib/browser";
import { VesSelectEmulatorCommand } from "./commands";
import { VesRunDefaultEmulatorPreference } from "./preferences";
import { getDefaultEmulatorConfig } from "./commands/run";

@injectable()
export class VesRunStatusBarContribution implements FrontendApplicationContribution {
    @inject(PreferenceService) protected readonly preferenceService: PreferenceService;
    @inject(StatusBar) protected readonly statusBar: StatusBar;

    onStart(app: FrontendApplication) {
        this.updateStatusBar();
    };

    updateStatusBar() {
        this.preferenceService.onPreferenceChanged(({ preferenceName }) => {
            if (preferenceName === VesRunDefaultEmulatorPreference.id) {
                this.setSelectedEmulatorStatusBar(getDefaultEmulatorConfig(this.preferenceService).name);
            }
        });
    }

    setSelectedEmulatorStatusBar(name: string) {
        this.statusBar.setElement("ves-selected-emulator", {
            alignment: StatusBarAlignment.LEFT,
            command: VesSelectEmulatorCommand.id,
            priority: 102,
            text: `$(play) ${name}`,
            tooltip: "Select Default Emulator Config"
        });
    }
}

export function bindVesRunStatusBar(bind: interfaces.Bind): void {
    bind(VesRunStatusBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesRunStatusBarContribution);
}
