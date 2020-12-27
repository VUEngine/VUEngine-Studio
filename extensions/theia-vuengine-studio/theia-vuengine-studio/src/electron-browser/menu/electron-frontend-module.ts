import { ContainerModule } from 'inversify';
import { bindVesElectronMenu } from './electron-menu-contribution';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bindVesElectronMenu(bind, rebind);
});
