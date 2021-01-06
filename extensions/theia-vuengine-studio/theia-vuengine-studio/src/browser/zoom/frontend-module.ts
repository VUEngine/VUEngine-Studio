import { interfaces } from 'inversify';
import { bindVesZoomCommands } from './command-contribution';
import { bindVesZoomKeybindings } from './keybindings-contribution';
import { bindVesZoomPreferences } from './preferences-contribution';
import { bindVesZoomStatusBar } from './statusbar-contribution';

export function bindVesZoomContributions(bind: interfaces.Bind): void {
    bindVesZoomStatusBar(bind);
    bindVesZoomCommands(bind);
    bindVesZoomKeybindings(bind);
    bindVesZoomPreferences(bind);
}   
