import { ContainerModule } from '@theia/core/shared/inversify';
import { ElectronMenuContribution } from '@theia/core/lib/electron-browser/menu/electron-menu-contribution';
import { VesElectronMenuContribution } from './ves-touchbar-electron-menu-contribution';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    rebind(ElectronMenuContribution).to(VesElectronMenuContribution).inSingletonScope();
});
