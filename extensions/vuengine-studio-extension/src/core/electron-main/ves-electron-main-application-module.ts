import { ElectronMainApplicationContribution } from '@theia/core/lib/electron-main/electron-main-application';
import { ContainerModule } from 'inversify';
import { VesAppImageIconContribution } from './ves-appimage-icon-contribution';
import { VesMainApi } from './ves-electron-main-api';
import './ves-webxr-switches';

export default new ContainerModule(bind => {
    bind(VesMainApi).toSelf().inSingletonScope();
    bind(ElectronMainApplicationContribution).toService(VesMainApi);

    bind(VesAppImageIconContribution).toSelf().inSingletonScope();
    bind(ElectronMainApplicationContribution).toService(VesAppImageIconContribution);
});
