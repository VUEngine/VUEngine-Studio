import { ContainerModule } from 'inversify';
import { ElectronMenuContribution } from '@theia/core/lib/electron-browser/menu/electron-menu-contribution';
import { VesElectronMenuContribution } from './electron-menu-contribution';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(VesElectronMenuContribution).toSelf().inSingletonScope();
    rebind(ElectronMenuContribution).toService(VesElectronMenuContribution);
});
