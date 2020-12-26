import { interfaces } from 'inversify';
import { bindVesBrandingCommands } from './commands';
import { bindVesBrandingMenu } from './menu';

import "../../../src/browser/branding/style/index.css";

export function bindVesBrandingContributions(bind: interfaces.Bind): void {
    bindVesBrandingCommands(bind);
    bindVesBrandingMenu(bind);
}
