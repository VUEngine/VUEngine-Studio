import { inject, injectable, interfaces } from "inversify";
import { remote } from "electron";
import { FrontendApplication, PreferenceScope, PreferenceService } from "@theia/core/lib/browser";
import { ElectronMenuContribution } from "@theia/core/lib/electron-browser/menu/electron-menu-contribution";
import { CommandService, isOSX } from "@theia/core";
import { VesState } from "../../browser/common/ves-state";
import { VesBuildPrefs } from "../../browser/build/build-preferences";
import { VesEmulatorPrefs } from "../../browser/emulator/emulator-preferences";
import { getDefaultEmulatorConfig, getEmulatorConfigs } from "../../browser/emulator/commands/runInEmulator";
import { BuildMode } from "../../browser/build/build-types";

@injectable()
export class VesElectronMenuContribution extends ElectronMenuContribution {
    @inject(CommandService) protected readonly commandService!: CommandService;
    @inject(PreferenceService) protected readonly preferenceService: PreferenceService;
    @inject(VesState) protected readonly vesState: VesState;

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

            this.preferenceService.onPreferenceChanged(({ preferenceName }) => {
                if ([
                    VesBuildPrefs.DUMP_ELF.id,
                    VesBuildPrefs.PEDANTIC_WARNINGS.id,
                    VesBuildPrefs.ENABLE_WSL.id,
                ].includes(preferenceName)) {
                    rebuildMenu();
                }
            });
        }
    }

    protected vesBindTouchBar(): void {
        const { app } = require("electron").remote;

        app.on("ves-execute-command", (command: string) => this.commandService.executeCommand(command));
        app.on("ves-set-build-mode", (buildMode: BuildMode) => this.preferenceService.set(
            VesBuildPrefs.BUILD_MODE.id, buildMode, PreferenceScope.User
        ));
        app.on("ves-set-emulator", (emulatorName: string) => this.preferenceService.set(
            VesEmulatorPrefs.DEFAULT_EMULATOR.id, emulatorName, PreferenceScope.User
        ));

        // init touchbar values
        app.emit("ves-change-build-mode", this.preferenceService.get(VesBuildPrefs.BUILD_MODE.id));
        app.emit("ves-change-connected-flash-cart", this.vesState.connectedFlashCarts);
        app.emit("ves-change-build-folder", this.vesState.buildFolderExists);
        app.emit("ves-change-emulator", getDefaultEmulatorConfig(this.preferenceService).name);
        app.emit("ves-change-emulator-configs", getEmulatorConfigs(this.preferenceService));

        this.vesState.onDidChangeBuildStatus((buildStatus) => app.emit("ves-change-build-status", buildStatus));
        this.vesState.onDidChangeIsRunQueued((flag) => app.emit("ves-change-is-run-queued", flag));
        this.vesState.onDidChangeIsFlashQueued((flag) => app.emit("ves-change-is-flash-queued", flag));
        this.vesState.onDidChangeIsFlashing((flag) => app.emit("ves-change-is-flashing", flag));
        this.vesState.onDidChangeIsExportQueued((flag) => app.emit("ves-change-is-export-queued", flag));
        this.vesState.onDidChangeConnectedFlashCarts((config) => app.emit("ves-change-connected-flash-cart", config));
        this.vesState.onDidChangeBuildMode((buildMode) => app.emit("ves-change-build-mode", buildMode));
        this.vesState.onDidChangeBuildFolder((flags) => app.emit("ves-change-build-folder", flags));
        this.vesState.onDidChangeEmulator((name) => app.emit("ves-change-emulator", name));
        this.vesState.onDidChangeEmulatorConfigs((emulatorConfigs) => app.emit("ves-change-emulator-configs", emulatorConfigs));
    }
}

export function bindVesElectronMenu(bind: interfaces.Bind, rebind: interfaces.Rebind): void {
    bind(VesElectronMenuContribution).toSelf().inSingletonScope();
    rebind(ElectronMenuContribution).toService(VesElectronMenuContribution);
}
