import { RpcServer } from '@theia/core/lib/common/messaging/proxy-factory';

export const VesUpdaterPath = '/services/ves/updater';
export const VesUpdater = Symbol('VesUpdater');
export interface VesUpdater extends RpcServer<VesUpdaterClient> {
    checkForUpdates(): void;
    downloadUpdate(): void;
    onRestartToUpdateRequested(): void;
    disconnectClient(client: VesUpdaterClient): void;
}

export const VesUpdaterClient = Symbol('VesUpdaterClient');

export interface UpdaterError {
    message: string;
    errorLogPath?: string;
}

export interface VesUpdaterClient {
    updateAvailable(available: boolean, startupCheck: boolean): void;
    notifyReadyToInstall(): void;
    reportError(error: UpdaterError): void;
}
