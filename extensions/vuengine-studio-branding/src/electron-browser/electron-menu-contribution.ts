import { inject, injectable } from 'inversify';
import { remote } from 'electron'; /* eslint-disable-line */
import { FrontendApplication, PreferenceScope, /* PreferenceScope, */ PreferenceService } from '@theia/core/lib/browser';
import { ElectronMenuContribution } from '@theia/core/lib/electron-browser/menu/electron-menu-contribution';
import { CommandService, isOSX } from '@theia/core';
import { VesBuildService } from 'vuengine-studio-build/lib/browser/ves-build-service';
import { VesBuildPreferenceIds } from 'vuengine-studio-build/lib/browser/ves-build-preferences';
import { BuildMode } from 'vuengine-studio-build/lib/browser/ves-build-types';
import { VesEmulatorService } from 'vuengine-studio-emulator/lib/browser/ves-emulator-service';
import { VesEmulatorPreferenceIds } from 'vuengine-studio-emulator/lib/browser/ves-emulator-preferences';
import { VesFlashCartService } from 'vuengine-studio-flash-cart/lib/browser/ves-flash-cart-service';

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
            const rebuildMenu = () => remote.Menu.setApplicationMenu(this.factory.createMenuBar());

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
        const { app } = require('electron').remote; /* eslint-disable-line */

        app.on('ves-execute-command', (command: string) => this.commandService.executeCommand(command));
        app.on('ves-set-build-mode', (buildMode: BuildMode) => this.preferenceService.set(
            VesBuildPreferenceIds.BUILD_MODE, buildMode, PreferenceScope.User
        ));
        app.on('ves-set-emulator', (emulatorName: string) => this.preferenceService.set(
            VesEmulatorPreferenceIds.DEFAULT_EMULATOR, emulatorName, PreferenceScope.User
        ));

        // init touchbar values
        app.emit('ves-change-build-mode', this.preferenceService.get(VesBuildPreferenceIds.BUILD_MODE));
        app.emit('ves-change-connected-flash-cart', this.vesFlashCartService.connectedFlashCarts);
        app.emit('ves-change-build-folder', this.vesBuildService.buildFolderExists);
        app.emit('ves-change-emulator', this.vesEmulatorService.getDefaultEmulatorConfig().name);
        app.emit('ves-change-emulator-configs', this.vesEmulatorService.getEmulatorConfigs());

        this.vesBuildService.onDidChangeBuildStatus(buildStatus => app.emit('ves-change-build-status', buildStatus));
        this.vesBuildService.onDidChangeBuildMode(buildMode => app.emit('ves-change-build-mode', buildMode));
        this.vesBuildService.onDidChangeBuildFolder(flags => app.emit('ves-change-build-folder', flags));
        this.vesEmulatorService.onDidChangeIsQueued(flag => app.emit('ves-change-is-run-queued', flag));
        this.vesEmulatorService.onDidChangeEmulator(name => app.emit('ves-change-emulator', name));
        this.vesEmulatorService.onDidChangeEmulatorConfigs(emulatorConfigs => app.emit('ves-change-emulator-configs', emulatorConfigs));
        this.vesFlashCartService.onDidChangeIsQueued(flag => app.emit('ves-change-is-flash-queued', flag));
        this.vesFlashCartService.onDidChangeIsFlashing(flag => app.emit('ves-change-is-flashing', flag));
        this.vesFlashCartService.onDidChangeConnectedFlashCarts(config => app.emit('ves-change-connected-flash-cart', config));
        // this.vesExportService.onDidChangeIsQueued(flag => app.emit('ves-change-is-export-queued', flag));
    }
}
