import { CommandService, PreferenceScope, PreferenceService } from '@theia/core';
import { FrontendApplication } from '@theia/core/lib/browser';
import { ElectronMenuContribution } from '@theia/core/lib/electron-browser/menu/electron-menu-contribution';
import { inject, injectable } from '@theia/core/shared/inversify';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesBuildPreferenceIds } from '../../build/browser/ves-build-preferences';
import { VesBuildService } from '../../build/browser/ves-build-service';
import { BuildMode } from '../../build/browser/ves-build-types';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesEmulatorPreferenceIds } from '../../emulator/browser/ves-emulator-preferences';
import { VesEmulatorService } from '../../emulator/browser/ves-emulator-service';
import { VesFlashCartService } from '../../flash-cart/browser/ves-flash-cart-service';
import { ViewModeService } from '../../viewMode/browser/view-mode-service';
import { ViewMode } from '../../viewMode/browser/view-mode-types';
import { VesTouchBarCommands } from '../common/ves-touchbar-types';

@injectable()
export class VesElectronMenuContribution extends ElectronMenuContribution {
    @inject(CommandService)
    protected readonly commandService!: CommandService;
    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;
    @inject(VesBuildService)
    protected readonly vesBuildService: VesBuildService;
    @inject(VesCommonService)
    protected readonly vesCommonService: VesCommonService;
    @inject(VesEmulatorService)
    protected readonly vesEmulatorService: VesEmulatorService;
    @inject(VesFlashCartService)
    protected readonly vesFlashCartService: VesFlashCartService;
    @inject(ViewModeService)
    protected readonly viewModeService: ViewModeService;
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    onStart(app: FrontendApplication): void {
        super.onStart(app);
        this.vesBindTouchBar();
        app.shell.addClass(`os-${this.vesCommonService.getOs()}`);
    }

    protected hideTopPanel(app: FrontendApplication): void {
        // override this with an empty function so the top panel is not removed in electron
    }

    protected createCustomTitleBar(app: FrontendApplication): void {
        // override this with an empty function to prevent theia from layering its own top panel over our custom one
    }

    protected async vesBindTouchBar(): Promise<void> {
        await this.workspaceService.ready;
        // TODO: add more touchbar modes for emulator etc
        window.electronVesCore.sendTouchBarCommand(VesTouchBarCommands.init, this.workspaceService.opened);

        window.electronVesCore.onTouchBarEvent(VesTouchBarCommands.setViewMode, (viewMode: ViewMode) => this.viewModeService.setViewMode(viewMode));

        window.electronVesCore.onTouchBarEvent(VesTouchBarCommands.executeCommand, (command: string) => this.commandService.executeCommand(command));
        window.electronVesCore.onTouchBarEvent(VesTouchBarCommands.setBuildMode, (buildMode: BuildMode) => this.preferenceService.set(
            VesBuildPreferenceIds.BUILD_MODE, buildMode, PreferenceScope.User
        ));
        window.electronVesCore.onTouchBarEvent(VesTouchBarCommands.setEmulator, (emulatorName: string) => this.preferenceService.set(
            VesEmulatorPreferenceIds.DEFAULT_EMULATOR, emulatorName, PreferenceScope.User
        ));

        // init touchbar values
        window.electronVesCore.sendTouchBarCommand(VesTouchBarCommands.changeViewMode, this.viewModeService.getViewMode());
        window.electronVesCore.sendTouchBarCommand(VesTouchBarCommands.changeBuildMode, this.preferenceService.get(VesBuildPreferenceIds.BUILD_MODE));
        window.electronVesCore.sendTouchBarCommand(VesTouchBarCommands.changeConnectedFlashCart, this.vesFlashCartService.connectedFlashCarts);
        window.electronVesCore.sendTouchBarCommand(VesTouchBarCommands.changeEmulator, this.vesEmulatorService.getDefaultEmulatorConfig().name);
        window.electronVesCore.sendTouchBarCommand(VesTouchBarCommands.changeEmulatorConfigs, this.vesEmulatorService.getEmulatorConfigs());

        this.viewModeService.onDidChangeViewMode(viewModeChange =>
            window.electronVesCore.sendTouchBarCommand(VesTouchBarCommands.changeViewMode, viewModeChange.newViewMode));
        this.vesBuildService.onDidChangeIsQueued(buildStatus =>
            window.electronVesCore.sendTouchBarCommand(VesTouchBarCommands.changeBuildIsQueued, buildStatus));
        this.vesBuildService.onDidChangeBuildStatus(buildStatus =>
            window.electronVesCore.sendTouchBarCommand(VesTouchBarCommands.changeBuildStatus, buildStatus));
        this.vesBuildService.onDidChangeBuildMode(buildMode =>
            window.electronVesCore.sendTouchBarCommand(VesTouchBarCommands.changeBuildMode, buildMode));
        this.vesEmulatorService.onDidChangeIsQueued(flag =>
            window.electronVesCore.sendTouchBarCommand(VesTouchBarCommands.changeIsRunQueued, flag));
        this.vesEmulatorService.onDidChangeEmulator(name =>
            window.electronVesCore.sendTouchBarCommand(VesTouchBarCommands.changeEmulator, name));
        this.vesEmulatorService.onDidChangeEmulatorConfigs(emulatorConfigs =>
            window.electronVesCore.sendTouchBarCommand(VesTouchBarCommands.changeEmulatorConfigs, emulatorConfigs));
        this.vesFlashCartService.onDidChangeIsQueued(flag =>
            window.electronVesCore.sendTouchBarCommand(VesTouchBarCommands.changeIsFlashQueued, flag));
        this.vesFlashCartService.onDidChangeIsFlashing(flag =>
            window.electronVesCore.sendTouchBarCommand(VesTouchBarCommands.changeIsFlashing, flag));
        this.vesFlashCartService.onDidChangeFlashingProgress(progress =>
            window.electronVesCore.sendTouchBarCommand(VesTouchBarCommands.onDidChangeFlashingProgress, progress));
        this.vesFlashCartService.onDidChangeConnectedFlashCarts(config =>
            window.electronVesCore.sendTouchBarCommand(VesTouchBarCommands.changeConnectedFlashCart, config));
    }
}
