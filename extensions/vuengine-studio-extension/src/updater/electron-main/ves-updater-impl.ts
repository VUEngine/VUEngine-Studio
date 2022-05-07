import { ElectronMainApplication, ElectronMainApplicationContribution } from '@theia/core/lib/electron-main/electron-main-application';
import { injectable } from '@theia/core/shared/inversify';
import { VesUpdater, VesUpdaterClient } from '../common/ves-updater';

const { autoUpdater } = require('electron-updater');

autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'VUEngine',
    repo: 'VUEngine-Studio',
});

@injectable()
export class VesUpdaterImpl implements VesUpdater, ElectronMainApplicationContribution {

    protected clients: Array<VesUpdaterClient> = [];

    private initialCheck: boolean = true;
    private reportOnFirstRegistration: boolean = false;

    constructor() {
        autoUpdater.autoDownload = false;
        autoUpdater.on('update-available', () => {
            const startupCheck = this.initialCheck;
            if (this.initialCheck) {
                this.initialCheck = false;
                if (this.clients.length === 0) {
                    this.reportOnFirstRegistration = true;
                }
            }
            this.clients.forEach(c => c.updateAvailable(true, startupCheck));
        });
        autoUpdater.on('update-not-available', () => {
            if (this.initialCheck) {
                this.initialCheck = false;
                /* do not report that no update is available on start up */
                return;
            }
            this.clients.forEach(c => c.updateAvailable(false, false));
        });

        autoUpdater.on('update-downloaded', () => {
            this.clients.forEach(c => c.notifyReadyToInstall());
        });

        autoUpdater.on('error', (err: unknown) => {
            const errorLogPath = autoUpdater.logger.transports.file.getFile().path;
            this.clients.forEach(c => c.reportError({
                message: 'An error has occurred while attempting to update.', errorLogPath
            }));
        });
    }

    checkForUpdates(): void {
        autoUpdater.checkForUpdates();
    }

    onRestartToUpdateRequested(): void {
        autoUpdater.quitAndInstall();
    }

    downloadUpdate(): void {
        autoUpdater.downloadUpdate();
    }

    onStart(application: ElectronMainApplication): void {
        // Called when the contribution is starting. You can use both async and sync code from here.
        this.checkForUpdates();
    }

    onStop(application: ElectronMainApplication): void {
        // Invoked when the contribution is stopping. You can clean up things here. You are not allowed to call async code from here.
    }

    setClient(client: VesUpdaterClient | undefined): void {
        if (client) {
            this.clients.push(client);
            if (this.reportOnFirstRegistration) {
                this.reportOnFirstRegistration = false;
                this.clients.forEach(c => c.updateAvailable(true, true));
            }
        }
    }

    disconnectClient(client: VesUpdaterClient): void {
        const index = this.clients.indexOf(client);
        if (index !== -1) {
            this.clients.splice(index, 1);
        }
    }

    dispose(): void {
        this.clients.forEach(this.disconnectClient.bind(this));
    }
}
