import { ContainerModule } from 'inversify';
import { VesMainApi } from './ves-electron-main-api';
import { ElectronMainApplicationContribution } from '@theia/core/lib/electron-main/electron-main-application';

export default new ContainerModule(bind => {
    bind(VesMainApi).toSelf().inSingletonScope();
    bind(ElectronMainApplicationContribution).toService(VesMainApi);
});
