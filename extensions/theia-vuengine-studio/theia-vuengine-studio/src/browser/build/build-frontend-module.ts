import { interfaces } from 'inversify';
import { bindVesBuildCommands } from "./build-commands-contribution";
import { bindVesBuildKeybindings } from "./build-keybindings-contribution";
import { bindVesBuildMenu } from "./build-menu-contribution";
import { bindVesBuildPreferences } from "./build-preferences-contribution";
import { bindVesBuildStatusBar } from './build-statusbar-contribution';
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
