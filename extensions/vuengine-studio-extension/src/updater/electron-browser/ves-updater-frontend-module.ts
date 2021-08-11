import { ContainerModule } from '@theia/core/shared/inversify';
import { CommandContribution, MenuContribution } from '@theia/core/lib/common';
import { ElectronIpcConnectionProvider } from '@theia/core/lib/electron-browser/messaging/electron-ipc-connection-provider';
import { PreferenceContribution } from '@theia/core/lib/browser';
import { VesUpdater, VesUpdaterClient, VesUpdaterPath } from '../common/ves-updater';
import { ElectronMenuUpdater, VesUpdaterClientImpl, VesUpdaterFrontendContribution } from './ves-updater-frontend-contribution';
import { VesUpdaterPreferenceSchema } from './ves-updater-preferences';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(ElectronMenuUpdater).toSelf().inSingletonScope();
    bind(VesUpdaterClientImpl).toSelf().inSingletonScope();
    bind(VesUpdaterClient).toService(VesUpdaterClientImpl);
    bind(VesUpdater).toDynamicValue(context => {
        const client = context.container.get(VesUpdaterClientImpl);
        return ElectronIpcConnectionProvider.createProxy(context.container, VesUpdaterPath, client);
    }).inSingletonScope();
    bind(VesUpdaterFrontendContribution).toSelf().inSingletonScope();
    bind(MenuContribution).toService(VesUpdaterFrontendContribution);
    bind(CommandContribution).toService(VesUpdaterFrontendContribution);

    bind(PreferenceContribution).toConstantValue({ schema: VesUpdaterPreferenceSchema });
});
