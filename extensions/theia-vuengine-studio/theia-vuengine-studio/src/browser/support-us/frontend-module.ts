import { interfaces } from 'inversify';
import { bindVesSupportUsCommands } from './commands';
import { bindVesSupportUsMenu } from './menu';

export function bindVesSupportUsContributions(bind: interfaces.Bind): void {
    bindVesSupportUsCommands(bind);
    bindVesSupportUsMenu(bind);
}
