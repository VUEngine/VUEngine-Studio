import { ContainerModule } from '@theia/core/shared/inversify';
import { ElectronMainMenuFactory } from '@theia/core/lib/electron-browser/menu/electron-main-menu-factory';
import { VesElectronMainMenuFactory } from './ves-electron-main-menu-factory';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    rebind(ElectronMainMenuFactory).to(VesElectronMainMenuFactory).inSingletonScope();
});
