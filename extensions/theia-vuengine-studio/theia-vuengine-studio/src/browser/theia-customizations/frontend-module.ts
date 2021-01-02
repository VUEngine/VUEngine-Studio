import { interfaces } from 'inversify';
import { bindTheiaCustomizationScmHistoryModule } from './history/scm-history-frontend-module';
import { bindTheiaCustomizationDebugModule } from './debug/debug-frontend-module';
import { bindTheiaCustomizationPluginModule } from './plugin/plugin-frontend-module';

import "../../../src/browser/theia-customizations/style/buttons.css";
import "../../../src/browser/theia-customizations/style/quick-open.css";
import "../../../src/browser/theia-customizations/style/statusbar.css";

export function rebindtheiaContributions(bind: interfaces.Bind, rebind: interfaces.Rebind): void {
    bindTheiaCustomizationDebugModule(bind, rebind);
    bindTheiaCustomizationScmHistoryModule(bind, rebind);
    bindTheiaCustomizationPluginModule(bind, rebind);
}
