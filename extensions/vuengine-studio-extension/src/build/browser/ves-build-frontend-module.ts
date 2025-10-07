import { CommandContribution, MenuContribution, PreferenceContribution } from '@theia/core';
import { bindViewContribution, FrontendApplicationContribution, KeybindingContribution, WidgetFactory } from '@theia/core/lib/browser';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { ContainerModule } from '@theia/core/shared/inversify';
import { FileNavigatorFilter } from '@theia/navigator/lib/browser/navigator-filter';
import '../../../src/build/browser/style/index.css';
import { VesBuildContribution } from './ves-build-contribution';
import { VesBuildPathsService } from './ves-build-paths-service';
import { VesBuildPreferenceSchema } from './ves-build-preferences';
import { VesBuildService } from './ves-build-service';
import { VesBuildStatusBarContribution } from './ves-build-statusbar-contribution';
import { VesBuildViewContribution } from './ves-build-view-contribution';
import { VesBuildWidget } from './ves-build-widget';
import { VesFileNavigatorFilter } from './ves-navigator-filter';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // preferences
    bind(PreferenceContribution).toConstantValue({ schema: VesBuildPreferenceSchema });

    // commands, keybindings and menus
    bind(VesBuildContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesBuildContribution);
    bind(KeybindingContribution).toService(VesBuildContribution);
    bind(MenuContribution).toService(VesBuildContribution);

    // status bar entry
    bind(VesBuildStatusBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesBuildStatusBarContribution);

    // build services
    bind(VesBuildService).toSelf().inSingletonScope();
    bind(VesBuildPathsService).toSelf().inSingletonScope();

    // build view
    bindViewContribution(bind, VesBuildViewContribution);
    bind(FrontendApplicationContribution).toService(VesBuildViewContribution);
    bind(TabBarToolbarContribution).toService(VesBuildViewContribution);
    bind(VesBuildWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: VesBuildWidget.ID,
        createWidget: () => ctx.container.get<VesBuildWidget>(VesBuildWidget)
    })).inSingletonScope();

    // allow hiding build folder from navigator
    rebind(FileNavigatorFilter).to(VesFileNavigatorFilter).inSingletonScope();
});
