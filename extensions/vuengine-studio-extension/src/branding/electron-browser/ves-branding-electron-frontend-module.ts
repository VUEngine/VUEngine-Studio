import { ContainerModule } from '@theia/core/shared/inversify';
import { ElectronMenuContribution } from '@theia/core/lib/electron-browser/menu/electron-menu-contribution';
import { ElectronMainMenuFactory } from '@theia/core/lib/electron-browser/menu/electron-main-menu-factory';
import { VesElectronMenuContribution } from './ves-branding-electron-menu-contribution';
import { VesElectronMainMenuFactory } from './ves-electron-main-menu-factory';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(VesElectronMenuContribution).toSelf().inSingletonScope();
    rebind(ElectronMenuContribution).toService(VesElectronMenuContribution);

    rebind(ElectronMainMenuFactory).to(VesElectronMainMenuFactory).inSingletonScope();
});
