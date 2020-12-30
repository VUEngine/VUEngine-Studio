import { inject, injectable, interfaces } from "inversify";
import { remote } from "electron";
import { FrontendApplication, PreferenceService } from "@theia/core/lib/browser";
import { ElectronMenuContribution } from "@theia/core/lib/electron-browser/menu/electron-menu-contribution";
import { CommandService, isOSX } from "@theia/core";
import { VesStateModel } from "../../browser/common/vesStateModel";
import { VesBuildDumpElfPreference, VesBuildModePreference, VesBuildPedanticWarningsPreference } from "../../browser/build/preferences";
import { getDefaultEmulatorConfig } from "../../browser/run/commands/run";

@injectable()
export class VesElectronMenuContribution extends ElectronMenuContribution {
    @inject(CommandService) protected readonly commandService!: CommandService;
    @inject(PreferenceService) protected readonly preferenceService: PreferenceService;
    @inject(VesStateModel) protected readonly vesState: VesStateModel;

    onStart(app: FrontendApplication): void {
        super.onStart(app);
        this.vesBindTouchBar();
        this.vesBindDynamicMenu();
    }

    protected hideTopPanel(app: FrontendApplication): void {
        // override this with an empty function so the top panel is not removed in electron
    }

    protected vesBindDynamicMenu(): void {
        // workaround for dynamic menus in electron 
        // @see: https://github.com/eclipse-theia/theia/issues/446
        // TODO: remove this function when issue resolved
        if (isOSX) {
            const rebuildMenu = () => remote.Menu.setApplicationMenu(this.factory.createMenuBar());

            this.vesState.onDidChangeBuildMode(() => rebuildMenu());
            this.preferenceService.onPreferenceChanged(({ preferenceName }) => {
                if ([
                    VesBuildDumpElfPreference.id,
                    VesBuildPedanticWarningsPreference.id
                ].includes(preferenceName)) {
                    rebuildMenu();
                }
            });
        }
    }

    protected vesBindTouchBar(): void {
        const { app } = require("electron").remote;

        app.on("ves-execute-command", (command: string) => this.commandService.executeCommand(command));

        // init touchbar values
        app.emit("ves-change-build-mode", this.preferenceService.get(VesBuildModePreference.id));
        app.emit("ves-change-connected-flash-cart", this.vesState.connectedFlashCart);
        app.emit("ves-change-build-folder", this.vesState.buildFolderExists);
        app.emit("ves-change-emulator", getDefaultEmulatorConfig(this.preferenceService).name);

        this.vesState.onDidChangeIsBuilding((flag) => app.emit("ves-change-is-building", flag));
        this.vesState.onDidChangeIsRunQueued((flag) => app.emit("ves-change-is-run-queued", flag));
        this.vesState.onDidChangeIsFlashQueued((flag) => app.emit("ves-change-is-flash-queued", flag));
        this.vesState.onDidChangeIsExportQueued((flag) => app.emit("ves-change-is-export-queued", flag));
        this.vesState.onDidChangeConnectedFlashCart((config) => app.emit("ves-change-connected-flash-cart", config));
        this.vesState.onDidChangeBuildMode((buildMode) => app.emit("ves-change-build-mode", buildMode));
        this.vesState.onDidChangeBuildFolder((flags) => app.emit("ves-change-build-folder", flags));
        this.vesState.onDidChangeEmulator((name) => app.emit("ves-change-emulator", name));
    }
}

export function bindVesElectronMenu(bind: interfaces.Bind, rebind: interfaces.Rebind): void {
    bind(VesElectronMenuContribution).toSelf().inSingletonScope();
    rebind(ElectronMenuContribution).toService(VesElectronMenuContribution);
}
