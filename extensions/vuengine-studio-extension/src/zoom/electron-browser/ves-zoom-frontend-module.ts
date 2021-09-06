import { ContainerModule } from '@theia/core/shared/inversify';
import { CommandContribution } from '@theia/core/lib/common/command';
import { FrontendApplicationContribution, KeybindingContribution, PreferenceContribution } from '@theia/core/lib/browser';
import { VesZoomContribution } from './ves-zoom-contribution';
import { VesZoomStatusBarContribution } from './ves-zoom-statusbar-contribution';
import { VesZoomPreferenceSchema } from './ves-zoom-preferences';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // preferences
    bind(PreferenceContribution).toConstantValue({ schema: VesZoomPreferenceSchema });

    // commands and keybindings
    bind(VesZoomContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesZoomContribution);
    bind(KeybindingContribution).toService(VesZoomContribution);

    // status bar
    bind(VesZoomStatusBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesZoomStatusBarContribution);
});
