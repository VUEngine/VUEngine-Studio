import { interfaces } from 'inversify';
import { bindVesElectronMenu } from './electron-menu-contribution';

export function bindVesElectronMenuContributions(bind: interfaces.Bind, rebind: interfaces.Rebind): void {
    bindVesElectronMenu(bind, rebind);
};
