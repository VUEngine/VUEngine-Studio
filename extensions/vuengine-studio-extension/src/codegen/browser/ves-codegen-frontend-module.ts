import { CommandContribution } from '@theia/core';
import { ContainerModule } from '@theia/core/shared/inversify';
import { VesCodeGenContribution } from './ves-codegen-contribution';
import { VesCodeGenService } from './ves-codegen-service';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // commands
    bind(VesCodeGenContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesCodeGenContribution);

    // service
    bind(VesCodeGenService).toSelf().inSingletonScope();
});
