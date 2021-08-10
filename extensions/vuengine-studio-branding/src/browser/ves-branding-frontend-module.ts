import { ContainerModule } from '@theia/core/shared/inversify';
import { isOSX } from '@theia/core';
import { AboutDialog } from '@theia/core/lib/browser/about-dialog';
import { CommandContribution } from '@theia/core/lib/common/command';
import { FrontendApplicationContribution, WidgetFactory, bindViewContribution, LabelProviderContribution } from '@theia/core/lib/browser';
import { GettingStartedWidget } from '@theia/getting-started/lib/browser/getting-started-widget';
import { MenuContribution } from '@theia/core/lib/common/menu';
import { PreferenceConfigurations } from '@theia/core/lib/browser/preferences/preference-configurations';
import { DebugConsoleContribution } from '@theia/debug/lib/browser/console/debug-console-contribution';
import { DebugFrontendApplicationContribution } from '@theia/debug/lib/browser/debug-frontend-application-contribution';
import { DebugPrefixConfiguration } from '@theia/debug/lib/browser/debug-prefix-configuration';
import { ColorContribution } from '@theia/core/lib/browser/color-application-contribution';
import { ScmHistoryContribution } from '@theia/scm-extra/lib/browser/history/scm-history-contribution';
import { PluginViewRegistry } from '@theia/plugin-ext/lib/main/browser/view/plugin-view-registry';
import { BrowserMainMenuFactory, BrowserMenuBarContribution } from '@theia/core/lib/browser/menu/browser-menu-plugin';
import { PreferenceTreeGenerator } from '@theia/preferences/lib/browser/util/preference-tree-generator';
import { DefaultFileIconThemeContribution } from '@theia/core/lib/browser/icon-theme-contribution';

import { VesAboutDialog } from './ves-branding-about-dialog';
import { VesColorContribution } from './ves-branding-color-contribution';
import { VesBrandingContribution } from './ves-branding-contribution';
import { VesDebugContribution } from './ves-branding-debug-contribution';
import { VesGettingStartedViewContribution } from './ves-branding-getting-started-view-contribution';
import { VesGettingStartedWidget } from './ves-branding-getting-started-widget';
import { VesScmHistoryContribution } from './ves-branding-history-contribution';
import { VesPreferenceConfigurations } from './ves-branding-preference-configurations';
import { VesPluginContribution } from './ves-branding-plugin-contribution';
import { VesTitlebarApplicationTitleContribution } from './ves-branding-titlebar-application-title-view';
import { VesTitlebarApplicationTitleWidget } from './ves-branding-titlebar-application-title-widget';
import { VesTitlebarWindowControlsWidget } from './ves-branding-titlebar-window-controls-widget';
import { VesTitlebarWindowControlsContribution } from './ves-branding-titlebar-window-controls-view';
import { VesTitlebarActionButtonsWidget } from './ves-branding-titlebar-action-buttons-widget';
import { VesTitlebarActionButtonsContribution } from './ves-branding-titlebar-action-buttons-view';
import { VesPreferenceTreeGenerator } from './ves-branding-preference-tree-generator.';
import { VesDefaultFileIconThemeContribution } from './ves-branding-icon-theme-contribution';
import { VesBrandingLabelProviderContribution } from './ves-branding-label-provider';

import '../../src/browser/style/index.css';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // rename default icon theme
    bind(VesDefaultFileIconThemeContribution).toSelf().inSingletonScope();
    // @ts-ignore
    rebind(DefaultFileIconThemeContribution).to(VesDefaultFileIconThemeContribution);

    // custom theme colors
    bind(ColorContribution).to(VesColorContribution).inSingletonScope();

    // enable main menu
    if (!isOSX) {
        bind(BrowserMainMenuFactory).toSelf().inSingletonScope();
        bind(BrowserMenuBarContribution).toSelf().inSingletonScope();
        bind(FrontendApplicationContribution).toService(BrowserMenuBarContribution);
    }

    // getting started view
    bindViewContribution(bind, VesGettingStartedViewContribution);
    bind(FrontendApplicationContribution).toService(VesGettingStartedViewContribution);
    bind(VesGettingStartedWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: GettingStartedWidget.ID,
        createWidget: () => context.container.get<VesGettingStartedWidget>(VesGettingStartedWidget),
    })).inSingletonScope();

    // about dialog
    if (isBound(AboutDialog)) {
        rebind(AboutDialog).to(VesAboutDialog).inSingletonScope();
    } else {
        bind(AboutDialog).to(VesAboutDialog).inSingletonScope();
    }

    // branding commands and menus
    bind(VesBrandingContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesBrandingContribution);
    bind(MenuContribution).toService(VesBrandingContribution);

    // default configurations
    bind(VesPreferenceConfigurations).toSelf().inSingletonScope();
    rebind(PreferenceConfigurations).toService(VesPreferenceConfigurations);

    // add custom preference tree categories
    bind(VesPreferenceTreeGenerator).toSelf().inSingletonScope();
    rebind(PreferenceTreeGenerator).to(VesPreferenceTreeGenerator);

    // file icons & labels
    bind(VesBrandingLabelProviderContribution).toSelf().inSingletonScope();
    bind(LabelProviderContribution).toService(VesBrandingLabelProviderContribution);

    // TODO: unbind plugins view, type hierarchy view and  call hierarchy view

    // remove debug features
    bind(VesDebugContribution).toSelf().inSingletonScope();
    rebind(DebugFrontendApplicationContribution).toService(VesDebugContribution);
    rebind(DebugConsoleContribution).toConstantValue({
        registerCommands: () => { },
        registerMenus: () => { },
        registerKeybindings: () => { },
        registerToolbarItems: () => { }
    } as any); /* eslint-disable-line */
    rebind(DebugPrefixConfiguration).toConstantValue({
        registerCommands: () => { },
        registerMenus: () => { },
        registerKeybindings: () => { },
        registerToolbarItems: () => { }
    } as any); /* eslint-disable-line */

    // git history
    bind(VesScmHistoryContribution).toSelf().inSingletonScope();
    rebind(ScmHistoryContribution).toService(VesScmHistoryContribution);

    // remove "test" view
    bind(VesPluginContribution).toSelf().inSingletonScope();
    rebind(PluginViewRegistry).toService(VesPluginContribution);

    // title bar application title
    bindViewContribution(bind, VesTitlebarApplicationTitleContribution);
    bind(FrontendApplicationContribution).toService(
        VesTitlebarApplicationTitleContribution
    );
    bind(VesTitlebarApplicationTitleWidget).toSelf();
    bind(WidgetFactory)
        .toDynamicValue(ctx => ({
            id: VesTitlebarApplicationTitleWidget.ID,
            createWidget: () =>
                ctx.container.get<VesTitlebarApplicationTitleWidget>(
                    VesTitlebarApplicationTitleWidget
                ),
        }))
        .inSingletonScope();

    // title bar window controls
    if (!isOSX) {
        bindViewContribution(bind, VesTitlebarWindowControlsContribution);
        bind(FrontendApplicationContribution).toService(VesTitlebarWindowControlsContribution);
        bind(VesTitlebarWindowControlsWidget).toSelf();
        bind(WidgetFactory)
            .toDynamicValue(ctx => ({
                id: VesTitlebarWindowControlsWidget.ID,
                createWidget: () =>
                    ctx.container.get<VesTitlebarWindowControlsWidget>(
                        VesTitlebarWindowControlsWidget
                    ),
            }))
            .inSingletonScope();
    }

    // title bar action buttons
    bindViewContribution(bind, VesTitlebarActionButtonsContribution);
    bind(FrontendApplicationContribution).toService(VesTitlebarActionButtonsContribution);
    bind(VesTitlebarActionButtonsWidget).toSelf();
    bind(WidgetFactory)
        .toDynamicValue(ctx => ({
            id: VesTitlebarActionButtonsWidget.ID,
            createWidget: () =>
                ctx.container.get<VesTitlebarActionButtonsWidget>(
                    VesTitlebarActionButtonsWidget
                ),
        }))
        .inSingletonScope();
});
