import { interfaces } from 'inversify';
import { bindVesProjectsCommands } from './command-contribution';
import { bindVesProjectsWidgets } from './widgets-contribution';
import { bindVesProjectsPreferences } from './preferences-contribution';

import "../../../src/browser/projects/style/index.css";

export function bindVesProjectsContributions(bind: interfaces.Bind): void {
    bindVesProjectsCommands(bind);
    bindVesProjectsWidgets(bind);
    bindVesProjectsPreferences(bind);
}
