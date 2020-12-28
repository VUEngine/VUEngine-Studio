import { interfaces } from 'inversify';
import { bindVesBuildCommands } from "./commands-contribution";
import { bindVesBuildKeybindings } from "./keybindings-contribution";
import { bindVesBuildMenu } from "./menu-contribution";
import { bindVesBuildPreferences } from "./preferences-contribution";

export function bindVesBuildContributions(bind: interfaces.Bind): void {
    bindVesBuildPreferences(bind);
    bindVesBuildCommands(bind);
    bindVesBuildMenu(bind);
    bindVesBuildKeybindings(bind);
}
