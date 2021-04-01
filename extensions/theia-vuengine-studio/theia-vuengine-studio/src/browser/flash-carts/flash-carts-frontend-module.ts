import { interfaces } from 'inversify';
import { bindVesFlashCartsCommands } from "./flash-carts-commands-contribution";
import { bindVesFlashCartsKeybindings } from "./flash-carts-keybindings-contribution";
import { bindVesFlashCartsMenu } from "./flash-carts-menu-contribution";
import { bindVesFlashCartsPreferences } from "./flash-carts-preferences-contribution";
import { bindVesFlashCartsStatusBar } from './flash-carts-statusbar-contribution';
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
