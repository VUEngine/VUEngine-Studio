import { interfaces } from 'inversify';
import { bindVesRunCommands } from "./command-contribution";
import { bindVesRunKeybindings } from "./keybindings-contribution";
import { bindVesRunMenu } from "./menu-contribution";
import { bindVesRunPreferences } from "./preferences-contribution";

export function bindVesRunContributions(bind: interfaces.Bind): void {
    bindVesRunPreferences(bind);
    bindVesRunCommands(bind);
    bindVesRunMenu(bind);
    bindVesRunKeybindings(bind);
}
