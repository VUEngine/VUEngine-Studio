import { JsonRpcServer } from '@theia/core/lib/common/messaging/proxy-factory';

export const VesUpdaterPath = '/services/ves-updater';
export const VesUpdater = Symbol('VesUpdater');
export interface VesUpdater extends JsonRpcServer<VesUpdaterClient> {
    checkForUpdates(): void;
    downloadUpdate(): void;
    onRestartToUpdateRequested(): void;
    disconnectClient(client: VesUpdaterClient): void;
}

export const VesUpdaterClient = Symbol('VesUpdaterClient');
export interface VesUpdaterClient {
    updateAvailable(available: boolean, startupCheck: boolean): void;
    notifyReadyToInstall(): void;
    reportError(error: string): void;
}
