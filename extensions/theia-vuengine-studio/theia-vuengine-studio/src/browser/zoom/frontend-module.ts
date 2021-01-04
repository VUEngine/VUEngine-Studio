import { interfaces } from 'inversify';
import { bindVesZoomCommands } from './command-contribution';
import { bindVesZoomKeybindings } from './keybindings-contribution';
import { bindVesZoomStatusBar } from './statusbar-contribution';

export function bindVesZoomContributions(bind: interfaces.Bind): void {
    // TODO: persist zoom level and reapply on app start
    bindVesZoomStatusBar(bind);
    bindVesZoomCommands(bind);
    bindVesZoomKeybindings(bind);
}   
