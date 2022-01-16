import { JsonRpcConnectionHandler } from '@theia/core/lib/common/messaging/proxy-factory';
import { ElectronConnectionHandler } from '@theia/core/lib/electron-common/messaging/electron-connection-handler';
import { ElectronMainApplicationContribution } from '@theia/core/lib/electron-main/electron-main-application';
import { ContainerModule } from '@theia/core/shared/inversify';
import { VesUpdater, VesUpdaterClient, VesUpdaterPath } from '../common/ves-updater';
import { VesUpdaterImpl } from './ves-updater-impl';

export default new ContainerModule(bind => {
    bind(VesUpdaterImpl).toSelf().inSingletonScope();
    bind(VesUpdater).toService(VesUpdaterImpl);
    bind(ElectronMainApplicationContribution).toService(VesUpdater);
    bind(ElectronConnectionHandler).toDynamicValue(context =>
        new JsonRpcConnectionHandler<VesUpdaterClient>(VesUpdaterPath, client => {
            const server = context.container.get<VesUpdater>(VesUpdater);
            server.setClient(client);
            client.onDidCloseConnection(() => server.disconnectClient(client));
            return server;
        })
    ).inSingletonScope();
});
