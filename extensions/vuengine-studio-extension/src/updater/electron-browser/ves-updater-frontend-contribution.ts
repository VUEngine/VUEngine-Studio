import { getCurrentWindow } from '@theia/core/electron-shared/@electron/remote';
import { BrowserWindow, Menu } from '@theia/core/electron-shared/electron';
import { CommonMenus, OpenerService } from '@theia/core/lib/browser';
import { PreferenceScope, PreferenceService } from '@theia/core/lib/browser/preferences';
import {
    CommandContribution,
    CommandRegistry,
    Emitter,
    MenuContribution,
    MenuModelRegistry,
    MenuPath,
    MessageService,
    Progress
} from '@theia/core/lib/common';
import { isOSX } from '@theia/core/lib/common/os';
import URI from '@theia/core/lib/common/uri';
import { ElectronMainMenuFactory } from '@theia/core/lib/electron-browser/menu/electron-main-menu-factory';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { clearInterval, setInterval } from 'timers';
import { UpdaterError, VesUpdater, VesUpdaterClient } from '../common/ves-updater';
import { VesUpdaterCommands } from './ves-updater-commands';

export namespace VesUpdaterMenu {
    export const MENU_PATH: MenuPath = [...CommonMenus.FILE_SETTINGS_SUBMENU, '3_settings_submenu_update'];
}

@injectable()
export class VesUpdaterClientImpl implements VesUpdaterClient {
    @inject(PreferenceService) private readonly preferenceService: PreferenceService;

    protected readonly onReadyToInstallEmitter = new Emitter<void>();
    readonly onReadyToInstall = this.onReadyToInstallEmitter.event;

    protected readonly onUpdateAvailableEmitter = new Emitter<boolean>();
    readonly onUpdateAvailable = this.onUpdateAvailableEmitter.event;

    protected readonly onErrorEmitter = new Emitter<UpdaterError>();
    readonly onError = this.onErrorEmitter.event;

    notifyReadyToInstall(): void {
        this.onReadyToInstallEmitter.fire();
    }

    updateAvailable(available: boolean, startupCheck: boolean): void {
        if (startupCheck) {
            // When we are checking for updates after program launch we need to check whether to prompt the user
            // we need to wait for the preference service. Also add a few seconds delay before showing the dialog
            this.preferenceService.ready
                .then(() => {
                    setTimeout(() => {
                        const reportOnStart: boolean = this.preferenceService.get('updates.reportOnStart', true);
                        if (reportOnStart) {
                            this.onUpdateAvailableEmitter.fire(available);
                        }
                    }, 10000);
                });
        } else {
            this.onUpdateAvailableEmitter.fire(available);
        }
    }

    reportError(error: UpdaterError): void {
        this.onErrorEmitter.fire(error);
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

    private setMenu(menu: Menu | null = this.factory.createElectronMenuBar(), electronWindow: BrowserWindow = getCurrentWindow()): void {
        if (isOSX) {
            Menu.setApplicationMenu(menu);
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

    @inject(OpenerService)
    protected readonly openerService: OpenerService;

    protected readyToUpdate = false;

    private progress: Progress | undefined;
    private intervalId: NodeJS.Timeout | undefined;

    @postConstruct()
    protected init(): void {
        this.updaterClient.onUpdateAvailable(available => {
            if (available) {
                this.handleDownloadUpdate();
            } else {
                this.handleNoUpdate();
            }
        });

        this.updaterClient.onReadyToInstall(async () => {
            this.readyToUpdate = true;
            this.menuUpdater.update();
            this.handleUpdatesAvailable();
        });

        this.updaterClient.onError(error => this.handleError(error));
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
            this.preferenceService.set('updates.reportOnStart', false, PreferenceScope.User);
            return;
        }
        if (answer === 'Yes') {
            this.stopProgress();
            this.progress = await this.messageService.showProgress({
                text: 'Application Update'
            });
            let dots = 0;
            this.intervalId = setInterval(() => {
                if (this.progress !== undefined) {
                    dots = (dots + 1) % 4;
                    this.progress.report({ message: 'Downloading' + '.'.repeat(dots) });
                }
            }, 1000);
            this.updater.downloadUpdate();
        }
    }

    protected async handleNoUpdate(): Promise<void> {
        this.messageService.info('Already using the latest version');
    }

    protected async handleUpdatesAvailable(): Promise<void> {
        if (this.progress !== undefined) {
            this.progress.report({ work: { done: 1, total: 1 } });
            this.stopProgress();
        }
        const answer = await this.messageService.info('Ready to update. Do you want to update now? (This will restart the application)', 'No', 'Yes');
        if (answer === 'Yes') {
            this.updater.onRestartToUpdateRequested();
        }
    }

    protected async handleError(error: UpdaterError): Promise<void> {
        this.stopProgress();
        if (error.errorLogPath) {
            const viewLogAction = 'View Error Log';
            const answer = await this.messageService.error(error.message, viewLogAction);
            if (answer === viewLogAction) {
                const uri = new URI(error.errorLogPath);
                const opener = await this.openerService.getOpener(uri);
                opener.open(uri);
            }
        } else {
            this.messageService.error(error.message);
        }
    }

    private stopProgress(): void {
        if (this.intervalId !== undefined) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
        if (this.progress !== undefined) {
            this.progress.cancel();
            this.progress = undefined;
        }
    }
}
