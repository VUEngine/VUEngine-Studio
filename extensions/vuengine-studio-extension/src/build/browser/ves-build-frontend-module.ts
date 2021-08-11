import { ContainerModule } from '@theia/core/shared/inversify';
import { CommandContribution } from '@theia/core';
import { bindViewContribution, FrontendApplicationContribution, KeybindingContribution, PreferenceContribution, WidgetFactory } from '@theia/core/lib/browser';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { VesBuildContribution } from './ves-build-contribution';
import { VesBuildPreferenceSchema } from './ves-build-preferences';
import { VesBuildService } from './ves-build-service';
import { VesBuildStatusBarContribution } from './ves-build-statusbar-contribution';
import { VesBuildViewContribution } from './ves-build-view';
import { VesBuildWidget } from './ves-build-widget';
import '../../../src/build/browser/style/index.css';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // preferences
    bind(PreferenceContribution).toConstantValue({ schema: VesBuildPreferenceSchema });

    // commands, keybindings and menus
    bind(VesBuildContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesBuildContribution);
    bind(KeybindingContribution).toService(VesBuildContribution);
    // bind(MenuContribution).toService(VesBuildContribution);

    // status bar entry
    bind(VesBuildStatusBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesBuildStatusBarContribution);

    // build service
    bind(VesBuildService).toSelf().inSingletonScope();

    // build view
    bindViewContribution(bind, VesBuildViewContribution);
    bind(FrontendApplicationContribution).toService(VesBuildViewContribution);
    bind(TabBarToolbarContribution).toService(VesBuildViewContribution);
    bind(VesBuildWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: VesBuildWidget.ID,
        createWidget: () => ctx.container.get<VesBuildWidget>(VesBuildWidget)
    })).inSingletonScope();
});
