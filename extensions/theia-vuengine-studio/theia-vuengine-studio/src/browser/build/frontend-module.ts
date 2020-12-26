import { interfaces } from 'inversify';
import { bindVesBuildCommands } from "./commands";
import { bindVesBuildKeybindings } from "./keybindings";
import { bindVesBuildMenu } from "./menu";
import { bindVesBuildPreferences } from "./preferences";

export function bindVesBuildContributions(bind: interfaces.Bind): void {
    bindVesBuildPreferences(bind);
    bindVesBuildCommands(bind);
    bindVesBuildMenu(bind);
    bindVesBuildKeybindings(bind);
}
