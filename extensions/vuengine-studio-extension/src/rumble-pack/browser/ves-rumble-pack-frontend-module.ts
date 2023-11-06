import { CommandContribution } from '@theia/core';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import { VesRumblePackContribution } from './ves-rumble-pack-contribution';
import { VesRumblePackService } from './ves-rumble-pack-service';
import { VesRumblePackStatusBarContribution } from './ves-rumble-pack-statusbar-contribution';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // commands
    bind(VesRumblePackContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesRumblePackContribution);

    // status bar entry
    bind(VesRumblePackStatusBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesRumblePackStatusBarContribution);

    // rumble pack service
    bind(VesRumblePackService).toSelf().inSingletonScope();
});
