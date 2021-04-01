import { interfaces } from 'inversify';
import { bindVesProjectsCommands } from './projects-command-contribution';
import { bindVesProjectsWidgets } from './widget/projects-widgets-contribution';
import { bindVesProjectsPreferences } from './projects-preferences-contribution';

import "../../../src/browser/projects/style/index.css";

export function bindVesProjectsContributions(bind: interfaces.Bind): void {
    bindVesProjectsCommands(bind);
    bindVesProjectsWidgets(bind);
    bindVesProjectsPreferences(bind);
}
