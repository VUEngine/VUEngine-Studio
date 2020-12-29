import { interfaces } from 'inversify';
//import { rebindScmHistoryModule } from './history/scm-history-frontend-module';

import "../../../src/browser/theia-customizations/style/quick-open.css";

export function rebindtheiaContributions(bind: interfaces.Bind, rebind: interfaces.Rebind): void {
    //rebindScmHistoryModule(bind, rebind);


    // example how to completely remove a contribution
    // rebind(OutlineViewContribution).toConstantValue({
    //     registerCommands: () => { },
    //     registerMenus: () => { },
    //     registerKeybindings: () => { },
    //     registerToolbarItems: () => { }
    // } as any);
}
