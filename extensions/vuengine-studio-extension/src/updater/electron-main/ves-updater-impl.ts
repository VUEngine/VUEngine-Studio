import * as http from 'http';
import * as os from 'os';
import * as path from 'path';
import { injectable } from '@theia/core/shared/inversify';
import * as fs from '@theia/core/shared/fs-extra';
import { ElectronMainApplication, ElectronMainApplicationContribution } from '@theia/core/lib/electron-main/electron-main-application';
import { VesUpdater, VesUpdaterClient } from '../common/ves-updater';

const { autoUpdater } = require('electron-updater');
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

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
            this.clients.forEach(c => c.reportError('Error during update'));
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

        // record download stat, ignore errors
        fs.mkdtemp(path.join(os.tmpdir(), 'vuengine-studio-updater-'))
            .then(tmpDir => {
                const file = fs.createWriteStream(path.join(tmpDir, 'update'));
                http.get('https://www.eclipse.org/downloads/download.php?file=/theia/update&r=1', response => {
                    response.pipe(file);
                    file.on('finish', () => {
                        file.close();
                    });
                });
            });
    }

    onStart(application: ElectronMainApplication): void {
        // Called when the contribution is starting. You can use both async and sync code from here.
        this.checkForUpdates();
    }

    onStop(application: ElectronMainApplication): void {
        // Invoked when the contribution is stopping. You can clean up things here. You are not allowed call async code from here.
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