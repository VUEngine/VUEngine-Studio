import { CommandContribution, MenuContribution } from '@theia/core';
import { ContainerModule } from '@theia/core/shared/inversify';
import { VesMigrateContribution } from './ves-migrate-contribution';
import { VesMigrateService } from './ves-migrate-service';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // commands and menus
    bind(VesMigrateContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesMigrateContribution);
    bind(MenuContribution).toService(VesMigrateContribution);

    // project migration service
    bind(VesMigrateService).toSelf().inSingletonScope();
});
