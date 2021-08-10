import { ContainerModule } from '@theia/core/shared/inversify';
import { PreferenceContribution } from '@theia/core/lib/browser';
import { CommandContribution } from '@theia/core/lib/common/command';

import { VesPluginsContribution } from './ves-plugins-contribution';
import { VesPluginsPreferenceSchema } from './ves-plugins-preferences';
import { VesPluginsService } from './ves-plugins-service';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // commands
    bind(VesPluginsContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesPluginsContribution);

    // preferences
    bind(PreferenceContribution).toConstantValue({ schema: VesPluginsPreferenceSchema });

    // project service
    bind(VesPluginsService).toSelf().inSingletonScope();
});
