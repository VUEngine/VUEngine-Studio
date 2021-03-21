import { interfaces } from 'inversify';
import { bindVesFlashCartsCommands } from "./commands-contribution";
import { bindVesFlashCartsKeybindings } from "./keybindings-contribution";
import { bindVesFlashCartsMenu } from "./menu-contribution";
import { bindVesFlashCartsPreferences } from "./preferences-contribution";
import { bindVesFlashCartsStatusBar } from './statusbar-contribution';
import { bindVesFlashCartsView } from './widget/flash-carts-view';
import "../../../src/browser/flash-carts/style/index.css";

export function bindVesFlashCartsContributions(bind: interfaces.Bind): void {
    bindVesFlashCartsPreferences(bind);
    bindVesFlashCartsCommands(bind);
    bindVesFlashCartsMenu(bind);
    bindVesFlashCartsKeybindings(bind);
    bindVesFlashCartsStatusBar(bind);
    bindVesFlashCartsView(bind);
}
