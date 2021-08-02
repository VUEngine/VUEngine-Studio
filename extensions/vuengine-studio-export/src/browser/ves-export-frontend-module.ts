import { ContainerModule } from '@theia/core/shared/inversify';
import { CommandContribution } from '@theia/core';
import { KeybindingContribution } from '@theia/core/lib/browser';

import { VesExportContribution } from './ves-export-contribution';
import { VesExportService } from './ves-export-service';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // commands, keybindings and menus
    bind(VesExportContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesExportContribution);
    bind(KeybindingContribution).toService(VesExportContribution);
    // bind(MenuContribution).toService(VesExportContribution);

    // export service
    bind(VesExportService).toSelf().inSingletonScope();
});
