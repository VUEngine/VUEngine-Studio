import { interfaces } from 'inversify';
import { bindVesBuildCommands } from "./commands-contribution";
import { bindVesBuildKeybindings } from "./keybindings-contribution";
import { bindVesBuildMenu } from "./menu-contribution";
import { bindVesBuildPreferences } from "./preferences-contribution";
import { bindVesBuildStatusBar } from './statusbar-contribution';
import { bindVesBuildView } from './widget/build-view';
import "../../../src/browser/build/style/index.css";

export function bindVesBuildContributions(bind: interfaces.Bind): void {
    bindVesBuildPreferences(bind);
    bindVesBuildCommands(bind);
    bindVesBuildMenu(bind);
    bindVesBuildKeybindings(bind);
    bindVesBuildStatusBar(bind);
    bindVesBuildView(bind);
}
