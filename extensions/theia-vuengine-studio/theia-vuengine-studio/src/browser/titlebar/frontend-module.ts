import { interfaces } from 'inversify';
import { bindVesTitlebarActionButtonsViews } from './action-buttons/action-buttons-view';
import { bindVesTitlebarApplicationTitleViews } from './application-title/application-title-view';
import { bindVesWindowControlsCommands } from './window-controls/window-controls-commands';
import { bindVesTitlebarWindowControlsViews } from './window-controls/window-controls-view';
import { bindVesTitleBarMainMenu } from './theia-titlebar/theia-titlebar-main-menu';

import "../../../src/browser/titlebar/action-buttons/style/index.css";
import "../../../src/browser/titlebar/application-title/style/index.css";
import "../../../src/browser/titlebar/theia-titlebar/style/index.css";
import "../../../src/browser/titlebar/window-controls/style/index.css";

export function bindVesTitleBarContributions(bind: interfaces.Bind): void {
    bindVesTitleBarMainMenu(bind);
    bindVesTitlebarActionButtonsViews(bind);
    bindVesTitlebarApplicationTitleViews(bind);
    bindVesWindowControlsCommands(bind);
    bindVesTitlebarWindowControlsViews(bind);
}
