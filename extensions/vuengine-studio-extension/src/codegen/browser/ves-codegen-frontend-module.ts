import { CommandContribution } from '@theia/core';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import { VesCodeGenContribution } from './ves-codegen-contribution';
import { VesCodeGenService } from './ves-codegen-service';
import { VesCodeGenStatusBarContribution } from './ves-codegen-statusbar-contribution';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // commands
    bind(VesCodeGenContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesCodeGenContribution);

    // status bar entry
    bind(VesCodeGenStatusBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesCodeGenStatusBarContribution);

    // service
    bind(VesCodeGenService).toSelf().inSingletonScope();
});
