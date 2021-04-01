import { interfaces } from 'inversify';
import { bindVesTopbarActionButtonsViews } from './action-buttons/action-buttons-view';
import { bindVesTopbarApplicationTitleViews } from './application-title/application-title-view';
import { bindVesWindowControlsCommands } from './window-controls/window-controls-commands';
import { bindVesTopbarWindowControlsViews } from './window-controls/window-controls-view';
import { bindVesTopBarMainMenu } from './theia-topbar/theia-topbar-main-menu';

import "../../../src/browser/topbar/action-buttons/style/index.css";
import "../../../src/browser/topbar/application-title/style/index.css";
import "../../../src/browser/topbar/theia-topbar/style/index.css";
import "../../../src/browser/topbar/window-controls/style/index.css";

export function bindVesTopBarContributions(bind: interfaces.Bind): void {
    bindVesTopBarMainMenu(bind);
    bindVesTopbarActionButtonsViews(bind);
    bindVesTopbarApplicationTitleViews(bind);
    bindVesWindowControlsCommands(bind);
    bindVesTopbarWindowControlsViews(bind);
}
