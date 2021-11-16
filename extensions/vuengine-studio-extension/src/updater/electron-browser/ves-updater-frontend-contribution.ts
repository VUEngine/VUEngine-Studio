import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import {
    CommandContribution,
    CommandRegistry,
    Emitter,
    isOSX,
    MenuContribution,
    MenuModelRegistry,
    MenuPath,
    MessageService
} from '@theia/core/lib/common';
import { PreferenceScope, PreferenceService } from '@theia/core/lib/browser/preferences';
import { CommonMenus } from '@theia/core/lib/browser';
import { ElectronMainMenuFactory } from '@theia/core/lib/electron-browser/menu/electron-main-menu-factory';
import { BrowserWindow, Menu, remote } from '@theia/core/shared/electron';
import { VesUpdater, VesUpdaterClient } from '../common/ves-updater';
import { VesUpdaterPreferenceIds } from './ves-updater-preferences';
import { VesUpdaterCommands } from './ves-updater-commands';

export namespace VesUpdaterMenu {
    export const MENU_PATH: MenuPath = [...CommonMenus.FILE_SETTINGS_SUBMENU, '3_settings_submenu_update'];
}

@injectable()
export class VesUpdaterClientImpl implements VesUpdaterClient {

    @inject(PreferenceService)
    private readonly preferenceService: PreferenceService;

    protected readonly onDidChangeReadyToInstallEmitter = new Emitter<void>();
    readonly onDidChangeReadyToInstall = this.onDidChangeReadyToInstallEmitter.event;

    protected readonly onDidFindUpdateEmitter = new Emitter<boolean>();
    readonly onDidFindUpdate = this.onDidFindUpdateEmitter.event;

    protected readonly onDidEncounterErrorEmitter = new Emitter<string>();
    readonly onDidEncounterError = this.onDidEncounterErrorEmitter.event;

    notifyReadyToInstall(): void {
        this.onDidChangeReadyToInstallEmitter.fire();
    }

    updateAvailable(available: boolean, startupCheck: boolean): void {
        if (startupCheck) {
            // When we are checking for updates after program launch we need to check whether to prompt the user
            // we need to wait for the preference service. Also add a few seconds delay before showing the dialog
            this.preferenceService.ready
                .then(() => {
                    setTimeout(() => {
                        const reportOnStart: boolean = this.preferenceService.get(VesUpdaterPreferenceIds.REPORT_ON_START, true);
                        if (reportOnStart) {
                            this.onDidFindUpdateEmitter.fire(available);
                        }
                    }, 10000);
                });
        } else {
            this.onDidFindUpdateEmitter.fire(available);
        }

    }

    reportError(error: string): void {
        this.onDidEncounterErrorEmitter.fire(error);
    }
}

// Dynamic menus aren't yet supported by electron: https://github.com/eclipse-theia/theia/issues/446
@injectable()
export class ElectronMenuUpdater {
    @inject(ElectronMainMenuFactory)
    protected readonly factory: ElectronMainMenuFactory;

    public update(): void {
        this.setMenu();
    }

    private setMenu(menu: Menu | null = this.factory.createElectronMenuBar(), electronWindow: BrowserWindow = remote.getCurrentWindow()): void {
        if (isOSX) {
            remote.Menu.setApplicationMenu(menu);
        } else {
            electronWindow.setMenu(menu);
        }
    }
}

@injectable()
export class VesUpdaterFrontendContribution implements CommandContribution, MenuContribution {

    @inject(MessageService)
    protected readonly messageService: MessageService;

    @inject(ElectronMenuUpdater)
    protected readonly menuUpdater: ElectronMenuUpdater;

    @inject(VesUpdater)
    protected readonly updater: VesUpdater;

    @inject(VesUpdaterClientImpl)
    protected readonly updaterClient: VesUpdaterClientImpl;

    @inject(PreferenceService)
    private readonly preferenceService: PreferenceService;

    protected readyToUpdate = false;

    @postConstruct()
    protected init(): void {
        this.updaterClient.onDidFindUpdate(available => {
            if (available) {
                this.handleDownloadUpdate();
            } else {
                this.handleNoUpdate();
            }
        });

        this.updaterClient.onDidChangeReadyToInstall(async () => {
            this.readyToUpdate = true;
            this.menuUpdater.update();
            this.handleUpdatesAvailable();
        });

        this.updaterClient.onDidEncounterError(error => this.handleError(error));
    }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(VesUpdaterCommands.CHECK_FOR_UPDATES, {
            execute: async () => {
                this.updater.checkForUpdates();
            },
            isEnabled: () => !this.readyToUpdate,
            isVisible: () => !this.readyToUpdate
        });
        registry.registerCommand(VesUpdaterCommands.RESTART_TO_UPDATE, {
            execute: () => this.updater.onRestartToUpdateRequested(),
            isEnabled: () => this.readyToUpdate,
            isVisible: () => this.readyToUpdate
        });
    }

    registerMenus(registry: MenuModelRegistry): void {
        registry.registerMenuAction(VesUpdaterMenu.MENU_PATH, {
            commandId: VesUpdaterCommands.CHECK_FOR_UPDATES.id
        });
        registry.registerMenuAction(VesUpdaterMenu.MENU_PATH, {
            commandId: VesUpdaterCommands.RESTART_TO_UPDATE.id
        });
    }

    protected async handleDownloadUpdate(): Promise<void> {
        const answer = await this.messageService.info('Updates found, do you want to download the update?', 'No', 'Yes', 'Never');
        if (answer === 'Never') {
            this.preferenceService.set('updater.reportOnStart', false, PreferenceScope.User);
            return;
        }
        if (answer === 'Yes') {
            this.updater.downloadUpdate();
        }
    }

    protected async handleNoUpdate(): Promise<void> {
        this.messageService.info('Already using the latest version');
    }

    protected async handleUpdatesAvailable(): Promise<void> {
        const answer = await this.messageService.info('Ready to update. Do you want to update now? (This will restart the application)', 'No', 'Yes');
        if (answer === 'Yes') {
            this.updater.onRestartToUpdateRequested();
        }
    }

    protected async handleError(error: string): Promise<void> {
        this.messageService.error(error);
    }

}
