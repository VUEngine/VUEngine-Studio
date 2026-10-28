import { ContainerModule } from 'inversify';
import { VesMainApi } from './ves-electron-main-api';
import { ElectronMainApplicationContribution } from '@theia/core/lib/electron-main/electron-main-application';
import { VesAppImageIconContribution } from './ves-appimage-icon-contribution';

export default new ContainerModule(bind => {
    bind(VesMainApi).toSelf().inSingletonScope();
    bind(ElectronMainApplicationContribution).toService(VesMainApi);

    bind(VesAppImageIconContribution).toSelf().inSingletonScope();
    bind(ElectronMainApplicationContribution).toService(VesAppImageIconContribution);
});
