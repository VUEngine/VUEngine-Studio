import { LocalizationContribution } from '@theia/core/lib/node/i18n/localization-contribution';
import { ContainerModule } from '@theia/core/shared/inversify';
import { VesLocalizationContribution } from './ves-i18n-localization-contribution';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(VesLocalizationContribution).toSelf().inSingletonScope();
    bind(LocalizationContribution).toService(VesLocalizationContribution);
});
