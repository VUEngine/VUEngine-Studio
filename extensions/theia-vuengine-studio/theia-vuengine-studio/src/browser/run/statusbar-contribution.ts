import { inject, injectable, interfaces } from "inversify";
import { FrontendApplication, FrontendApplicationContribution, PreferenceService, StatusBar, StatusBarAlignment } from "@theia/core/lib/browser";
import { VesRunCommand, VesSelectEmulatorCommand } from "./commands";
import { VesRunDefaultEmulatorPreference } from "./preferences";
import { getDefaultEmulatorConfig } from "./commands/run";
import { VesStateModel } from "../common/vesStateModel";

@injectable()
export class VesRunStatusBarContribution implements FrontendApplicationContribution {
    @inject(PreferenceService) protected readonly preferenceService: PreferenceService;
    @inject(StatusBar) protected readonly statusBar: StatusBar;
    @inject(VesStateModel) protected readonly vesState: VesStateModel;

    onStart(app: FrontendApplication) {
        this.updateStatusBar();
    };

    updateStatusBar() {
        this.setSelectedEmulatorStatusBar();

        this.vesState.onDidChangeIsRunning(() => this.setSelectedEmulatorStatusBar());
        this.preferenceService.onPreferenceChanged(({ preferenceName }) => {
            if (preferenceName === VesRunDefaultEmulatorPreference.id) {
                this.setSelectedEmulatorStatusBar();
            }
        });
    }

    setSelectedEmulatorStatusBar() {
        let label = "";
        let className = "";
        let command = VesSelectEmulatorCommand.id;
        let tooltip = VesSelectEmulatorCommand.label;
        if (this.vesState.isRunning) {
            label = "Running...";
            className = "active";
            command = VesRunCommand.id;
            tooltip = "Open Emulator";
        } else {
            label = getDefaultEmulatorConfig(this.preferenceService).name;
        }
        this.statusBar.setElement("ves-selected-emulator", {
            alignment: StatusBarAlignment.LEFT,
            command: command,
            className: className,
            priority: 2,
            text: `$(play) ${label}`,
            tooltip: tooltip,
        });
    }
}

export function bindVesRunStatusBar(bind: interfaces.Bind): void {
    bind(VesRunStatusBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesRunStatusBarContribution);
}
