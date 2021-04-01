import { interfaces } from 'inversify';
import { bindVesZoomCommands } from './zoom-command-contribution';
import { bindVesZoomKeybindings } from './zoom-keybindings-contribution';
import { bindVesZoomPreferences } from './zoom-preferences-contribution';
import { bindVesZoomStatusBar } from './zoom-statusbar-contribution';

export function bindVesZoomContributions(bind: interfaces.Bind): void {
    bindVesZoomStatusBar(bind);
    bindVesZoomCommands(bind);
    bindVesZoomKeybindings(bind);
    bindVesZoomPreferences(bind);
}
