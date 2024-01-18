import { PreferenceContribution } from '@theia/core/lib/browser';
import { CommandContribution, MenuContribution } from '@theia/core/lib/common';
import { ContainerModule } from '@theia/core/shared/inversify';
import { VesUpdaterFrontendContribution } from './ves-updater-frontend-contribution';
import { VesUpdaterPreferenceSchema } from './ves-updater-preferences';

export default new ContainerModule((bind, _unbind, isBound, rebind) => {
    bind(VesUpdaterFrontendContribution).toSelf().inSingletonScope();
    bind(MenuContribution).toService(VesUpdaterFrontendContribution);
    bind(CommandContribution).toService(VesUpdaterFrontendContribution);

    bind(PreferenceContribution).toConstantValue({ schema: VesUpdaterPreferenceSchema });
});
