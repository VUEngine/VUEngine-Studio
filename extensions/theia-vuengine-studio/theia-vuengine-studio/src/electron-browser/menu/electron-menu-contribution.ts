import { inject, injectable, interfaces } from "inversify";
import { FrontendApplication, PreferenceService } from "@theia/core/lib/browser";
import { ElectronMenuContribution } from "@theia/core/lib/electron-browser/menu/electron-menu-contribution";
import { CommandService } from "@theia/core";

@injectable()
export class VesElectronMenuContribution extends ElectronMenuContribution {
    @inject(CommandService) protected readonly commandService!: CommandService;
    @inject(PreferenceService) protected readonly preferenceService: PreferenceService;

    protected hideTopPanel(frontendApplication: FrontendApplication): void {
        // override this with an empty function so the top panel is not removed in electron




        // TODO: move these to their dedicated place
        const { app } = require("electron").remote;
        app.on("ves-execute-command", (command: string) => this.commandService.executeCommand(command));
        app.emit("ves-set-build-mode", this.preferenceService.get("build.buildMode"));
        this.preferenceService.onPreferenceChanged(({ preferenceName, newValue }) => {
            if (preferenceName === "build.buildMode") {
                app.emit("ves-set-build-mode", newValue);
            }
        });
    }
}

export function bindVesElectronMenu(bind: interfaces.Bind, rebind: interfaces.Rebind): void {
    bind(VesElectronMenuContribution).toSelf().inSingletonScope();
    rebind(ElectronMenuContribution).toService(VesElectronMenuContribution);
}
