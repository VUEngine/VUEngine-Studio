import { ContainerModule } from '@theia/core/shared/inversify';
import { ElectronMainApplication } from '@theia/core/lib/electron-main/electron-main-application';
import { VesElectronMainApplication } from './ves-touchbar-electron-main-application';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(VesElectronMainApplication).toSelf().inSingletonScope();
    rebind(ElectronMainApplication).toService(VesElectronMainApplication);
});
