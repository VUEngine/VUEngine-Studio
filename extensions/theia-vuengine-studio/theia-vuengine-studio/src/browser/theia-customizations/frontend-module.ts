import { interfaces } from 'inversify';
import { rebindScmHistoryModule } from './history/scm-history-frontend-module';
import { rebindDebugRemovalModule } from './debug/debug-frontend-module';

import "../../../src/browser/theia-customizations/style/quick-open.css";
import "../../../src/browser/theia-customizations/style/statusbar.css";

export function rebindtheiaContributions(bind: interfaces.Bind, rebind: interfaces.Rebind): void {
    rebindDebugRemovalModule(bind, rebind);
    rebindScmHistoryModule(bind, rebind);
}
