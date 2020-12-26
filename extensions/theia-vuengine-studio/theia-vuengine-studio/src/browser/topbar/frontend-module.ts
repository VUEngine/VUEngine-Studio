import { interfaces } from 'inversify';
import { bindVesTopbarActionButtonsViews } from './actionButtons/action-buttons-view';
import { bindVesTopbarApplicationTitleViews } from './applicationTitle/application-title-view';
import { bindVesWindowControlsCommands } from './windowControls/commands';
import { bindVesTopbarWindowControlsViews } from './windowControls/window-controls-view';
import { bindVesTopBarMainMenu } from './theiaTopbar/main-menu';

import "../../../src/browser/topbar/actionButtons/style/index.css";
import "../../../src/browser/topbar/applicationTitle/style/index.css";
import "../../../src/browser/topbar/windowControls/style/index.css";
import "../../../src/browser/topbar/theiaTopbar/style/index.css";

export function bindVesTopBarContributions(bind: interfaces.Bind): void {
    bindVesTopBarMainMenu(bind);
    bindVesTopbarActionButtonsViews(bind);
    bindVesTopbarApplicationTitleViews(bind);
    bindVesWindowControlsCommands(bind);
    bindVesTopbarWindowControlsViews(bind);
}
