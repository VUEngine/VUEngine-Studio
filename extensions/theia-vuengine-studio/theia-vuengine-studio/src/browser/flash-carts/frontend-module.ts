import { interfaces } from 'inversify';
import { bindVesFlashCartsCommands } from "./commands";
import { bindVesFlashCartsKeybindings } from "./keybindings";
import { bindVesFlashCartsMenu } from "./menu";
import { bindVesFlashCartsPreferences } from "./preferences";

export function bindVesFlashCartsContributions(bind: interfaces.Bind): void {
    bindVesFlashCartsPreferences(bind);
    bindVesFlashCartsCommands(bind);
    bindVesFlashCartsMenu(bind);
    bindVesFlashCartsKeybindings(bind);
}
