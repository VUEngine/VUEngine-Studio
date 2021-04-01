import { interfaces } from 'inversify';
import { bindVesSupportUsCommands } from './support-us-commands';
import { bindVesSupportUsMenu } from './support-us-menu';

export function bindVesSupportUsContributions(bind: interfaces.Bind): void {
    bindVesSupportUsCommands(bind);
    bindVesSupportUsMenu(bind);
}
