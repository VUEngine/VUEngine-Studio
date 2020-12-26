import { interfaces } from 'inversify';
import { bindVesRunCommands } from "./commands";
import { bindVesRunKeybindings } from "./keybindings";
import { bindVesRunMenu } from "./menu";
import { bindVesRunPreferences } from "./preferences";

export function bindVesRunContributions(bind: interfaces.Bind): void {
    bindVesRunPreferences(bind);
    bindVesRunCommands(bind);
    bindVesRunMenu(bind);
    bindVesRunKeybindings(bind);
}
