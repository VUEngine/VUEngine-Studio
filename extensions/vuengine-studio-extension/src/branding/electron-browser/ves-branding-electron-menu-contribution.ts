import { inject, injectable } from '@theia/core/shared/inversify';
import { remote } from '@theia/core/shared/electron';
import { FrontendApplication, PreferenceScope, PreferenceService } from '@theia/core/lib/browser';
import { ElectronMenuContribution } from '@theia/core/lib/electron-browser/menu/electron-menu-contribution';
import { CommandService, isOSX } from '@theia/core';
import { VesBuildService } from '../../build/browser/ves-build-service';
import { VesBuildPreferenceIds } from '../../build/browser/ves-build-preferences';
import { BuildMode } from '../../build/browser/ves-build-types';
import { VesEmulatorService } from '../../emulator/browser/ves-emulator-service';
import { VesEmulatorPreferenceIds } from '../../emulator/browser/ves-emulator-preferences';
import { VesFlashCartService } from '../../flash-cart/browser/ves-flash-cart-service';
import { VesTouchBarCommands } from '../common/ves-branding-types';

@injectable()
export class VesElectronMenuContribution extends ElectronMenuContribution {
    @inject(CommandService)
    protected readonly commandService!: CommandService;
    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;
    @inject(VesBuildService)
    protected readonly vesBuildService: VesBuildService;
    @inject(VesEmulatorService)
    protected readonly vesEmulatorService: VesEmulatorService;
    @inject(VesFlashCartService)
    protected readonly vesFlashCartService: VesFlashCartService;

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
            const rebuildMenu = () => remote.Menu.setApplicationMenu(this.factory.createElectronMenuBar());

            this.preferenceService.onPreferenceChanged(({ preferenceName }) => {
                if ([
                    VesBuildPreferenceIds.DUMP_ELF,
                    VesBuildPreferenceIds.PEDANTIC_WARNINGS,
                    VesBuildPreferenceIds.ENABLE_WSL,
                ].includes(preferenceName)) {
                    rebuildMenu();
                }
            });
        }
    }

    protected vesBindTouchBar(): void {
        const { app } = require('@theia/core/shared/electron').remote;

        app.on(VesTouchBarCommands.executeCommand, (command: string) => this.commandService.executeCommand(command));
        app.on(VesTouchBarCommands.setBuildMode, (buildMode: BuildMode) => this.preferenceService.set(
            VesBuildPreferenceIds.BUILD_MODE, buildMode, PreferenceScope.User
        ));
        app.on(VesTouchBarCommands.setEmulator, (emulatorName: string) => this.preferenceService.set(
            VesEmulatorPreferenceIds.DEFAULT_EMULATOR, emulatorName, PreferenceScope.User
        ));

        // init touchbar values
        app.emit(VesTouchBarCommands.changeBuildMode, this.preferenceService.get(VesBuildPreferenceIds.BUILD_MODE));
        app.emit(VesTouchBarCommands.changeConnectedFlashCart, this.vesFlashCartService.connectedFlashCarts);
        app.emit(VesTouchBarCommands.changeBuildFolder, this.vesBuildService.buildFolderExists);
        app.emit(VesTouchBarCommands.changeEmulator, this.vesEmulatorService.getDefaultEmulatorConfig().name);
        app.emit(VesTouchBarCommands.changeEmulatorConfigs, this.vesEmulatorService.getEmulatorConfigs());

        this.vesBuildService.onDidChangeIsQueued(buildStatus => app.emit(VesTouchBarCommands.changeBuildIsQueued, buildStatus));
        this.vesBuildService.onDidChangeBuildStatus(buildStatus => app.emit(VesTouchBarCommands.changeBuildStatus, buildStatus));
        this.vesBuildService.onDidChangeBuildMode(buildMode => app.emit(VesTouchBarCommands.changeBuildMode, buildMode));
        this.vesBuildService.onDidChangeBuildFolder(flags => app.emit(VesTouchBarCommands.changeBuildFolder, flags));
        this.vesEmulatorService.onDidChangeIsQueued(flag => app.emit(VesTouchBarCommands.changeIsRunQueued, flag));
        this.vesEmulatorService.onDidChangeEmulator(name => app.emit(VesTouchBarCommands.changeEmulator, name));
        this.vesEmulatorService.onDidChangeEmulatorConfigs(emulatorConfigs => app.emit(VesTouchBarCommands.changeEmulatorConfigs, emulatorConfigs));
        this.vesFlashCartService.onDidChangeIsQueued(flag => app.emit(VesTouchBarCommands.changeIsFlashQueued, flag));
        this.vesFlashCartService.onDidChangeIsFlashing(flag => app.emit(VesTouchBarCommands.changeIsFlashing, flag));
        this.vesFlashCartService.onDidChangeFlashingProgress(progress => app.emit(VesTouchBarCommands.onDidChangeFlashingProgress, progress));
        this.vesFlashCartService.onDidChangeConnectedFlashCarts(config => app.emit(VesTouchBarCommands.changeConnectedFlashCart, config));
    }
}
