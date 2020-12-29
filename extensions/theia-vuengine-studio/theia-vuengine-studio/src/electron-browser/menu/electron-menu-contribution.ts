import { inject, injectable, interfaces } from "inversify";
import { FrontendApplication, PreferenceService } from "@theia/core/lib/browser";
import { ElectronMenuContribution } from "@theia/core/lib/electron-browser/menu/electron-menu-contribution";
import { CommandService } from "@theia/core";
import { VesStateModel } from "../../browser/common/vesStateModel";
import { VesBuildModePreference } from "../../browser/build/preferences";

@injectable()
export class VesElectronMenuContribution extends ElectronMenuContribution {
    @inject(CommandService) protected readonly commandService!: CommandService;
    @inject(PreferenceService) protected readonly preferenceService: PreferenceService;
    @inject(VesStateModel) protected readonly vesState: VesStateModel;

    onStart(app: FrontendApplication): void {
        super.onStart(app);
        this.bindVesTouchBar();
    }

    protected hideTopPanel(app: FrontendApplication): void {
        // override this with an empty function so the top panel is not removed in electron
    }

    protected bindVesTouchBar(): void {
        const { app } = require("electron").remote;

        app.on("ves-execute-command", (command: string) => this.commandService.executeCommand(command));

        app.emit("ves-change-build-mode", this.preferenceService.get(VesBuildModePreference.id));
        app.emit("ves-change-connected-flash-cart", this.vesState.connectedFlashCart);
        app.emit("ves-change-build-folder", this.vesState.buildFolderExists);

        this.vesState.onDidChangeIsBuilding((flag) => app.emit("ves-change-is-building", flag));
        this.vesState.onDidChangeIsRunQueued((flag) => app.emit("ves-change-is-run-queued", flag));
        this.vesState.onDidChangeIsFlashQueued((flag) => app.emit("ves-change-is-flash-queued", flag));
        this.vesState.onDidChangeIsExportQueued((flag) => app.emit("ves-change-is-export-queued", flag));
        this.vesState.onDidChangeConnectedFlashCart((config) => app.emit("ves-change-connected-flash-cart", config));
        this.vesState.onDidChangeBuildMode((buildMode) => app.emit("ves-change-build-mode", buildMode));
        this.vesState.onDidChangeBuildFolder((flags) => app.emit("ves-change-build-folder", flags));
    }
}

export function bindVesElectronMenu(bind: interfaces.Bind, rebind: interfaces.Rebind): void {
    bind(VesElectronMenuContribution).toSelf().inSingletonScope();
    rebind(ElectronMenuContribution).toService(VesElectronMenuContribution);
}
