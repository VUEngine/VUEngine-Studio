import { CallHierarchyContribution } from '@theia/callhierarchy/lib/browser/callhierarchy-contribution';
import { isOSX } from '@theia/core';
import {
    ApplicationShell,
    bindViewContribution,
    FrontendApplicationContribution,
    LabelProviderContribution,
    PreferenceContribution,
    WebSocketConnectionProvider,
    WidgetFactory
} from '@theia/core/lib/browser';
import { AboutDialog } from '@theia/core/lib/browser/about-dialog';
import { ColorContribution } from '@theia/core/lib/browser/color-application-contribution';
import { DefaultFileIconThemeContribution } from '@theia/core/lib/browser/icon-theme-contribution';
import {
    BrowserMainMenuFactory,
    BrowserMenuBarContribution
} from '@theia/core/lib/browser/menu/browser-menu-plugin';
import { PreferenceConfigurations } from '@theia/core/lib/browser/preferences/preference-configurations';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { CommandContribution } from '@theia/core/lib/common/command';
import { MenuContribution } from '@theia/core/lib/common/menu';
import { ContainerModule } from '@theia/core/shared/inversify';
import { DebugConsoleContribution } from '@theia/debug/lib/browser/console/debug-console-contribution';
import { DebugFrontendApplicationContribution } from '@theia/debug/lib/browser/debug-frontend-application-contribution';
import { DebugPrefixConfiguration } from '@theia/debug/lib/browser/debug-prefix-configuration';
import { NavigatorWidgetFactory } from '@theia/navigator/lib/browser/navigator-widget-factory';
import { OutlineViewContribution } from '@theia/outline-view/lib/browser/outline-view-contribution';
import { PluginApiFrontendContribution } from '@theia/plugin-ext/lib/main/browser/plugin-frontend-contribution';
import { PluginFrontendViewContribution } from '@theia/plugin-ext/lib/main/browser/plugin-frontend-view-contribution';
import { PluginViewRegistry } from '@theia/plugin-ext/lib/main/browser/view/plugin-view-registry';
import { PreferenceTreeGenerator } from '@theia/preferences/lib/browser/util/preference-tree-generator';
import { PreferenceStringInputRenderer } from '@theia/preferences/lib/browser/views/components/preference-string-input';
import { ScmHistoryContribution } from '@theia/scm-extra/lib/browser/history/scm-history-contribution';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { QuickOpenWorkspace } from '@theia/workspace/lib/browser/quick-open-workspace';
import { VesGlobService, VES_GLOB_SERVICE_PATH } from '../common/ves-glob-service-protocol';
import { VesAboutDialog } from './ves-branding-about-dialog';
import { VesApplicationShell } from './ves-branding-application-shell';
import { VesColorContribution } from './ves-branding-color-contribution';
import { VesBrandingContribution } from './ves-branding-contribution';
import { VesDebugFrontendApplicationContribution } from './ves-branding-debug-contribution';
import { VesDebugPrefixConfiguration } from './ves-branding-debug-prefix-configuration';
import { VesGettingStartedViewContribution } from './ves-branding-getting-started-view-contribution';
import { VesGettingStartedWidget } from './ves-branding-getting-started-widget';
import { VesScmHistoryContribution } from './ves-branding-history-contribution';
import { VesDefaultFileIconThemeContribution } from './ves-branding-icon-theme-contribution';
import { VesBrandingLabelProviderContribution } from './ves-branding-label-provider';
import { VesPluginContribution } from './ves-branding-plugin-contribution';
import { VesPreferenceConfigurations } from './ves-branding-preference-configurations';
import { VesPreferenceTreeGenerator } from './ves-branding-preference-tree-generator.';
import { VesBrandingPreferenceSchema } from './ves-branding-preferences';
import { VesTitlebarActionButtonsContribution } from './ves-branding-titlebar-action-buttons-view';
import { VesTitlebarActionButtonsWidget } from './ves-branding-titlebar-action-buttons-widget';
import { VesTitlebarApplicationTitleContribution } from './ves-branding-titlebar-application-title-view';
import { VesTitlebarApplicationTitleWidget } from './ves-branding-titlebar-application-title-widget';
import { VesTitlebarWindowControlsContribution } from './ves-branding-titlebar-window-controls-view';
import { VesTitlebarWindowControlsWidget } from './ves-branding-titlebar-window-controls-widget';
import { VesCommonService } from './ves-common-service';
import { VesNavigatorWidgetFactory } from './ves-navigator-widget-factory';
import { VesPreferenceStringInputRenderer } from './ves-preference-string-input-renderer';
import { VesQuickOpenWorkspace } from './ves-quick-open-workspace';
import { VesWorkspaceService } from './ves-workspace-service';
import '../../../src/branding/browser/style/index.css';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // preferences
    bind(PreferenceContribution).toConstantValue({ schema: VesBrandingPreferenceSchema });

    // rename default icon theme
    bind(VesDefaultFileIconThemeContribution).toSelf().inSingletonScope();
    // @ts-ignore
    rebind(DefaultFileIconThemeContribution).to(VesDefaultFileIconThemeContribution);

    // custom theme colors
    bind(ColorContribution).to(VesColorContribution).inSingletonScope();

    // enable main menu
    bind(BrowserMainMenuFactory).toSelf().inSingletonScope();
    bind(BrowserMenuBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(BrowserMenuBarContribution);

    // getting started view
    bindViewContribution(bind, VesGettingStartedViewContribution);
    bind(FrontendApplicationContribution).toService(VesGettingStartedViewContribution);
    bind(TabBarToolbarContribution).toService(VesGettingStartedViewContribution);
    bind(VesGettingStartedWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: VesGettingStartedWidget.ID,
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

    // application shell overrides
    rebind(ApplicationShell).to(VesApplicationShell).inSingletonScope();

    // file icons & labels
    bind(VesBrandingLabelProviderContribution).toSelf().inSingletonScope();
    bind(LabelProviderContribution).toService(VesBrandingLabelProviderContribution);

    // remove debug features
    bind(VesDebugFrontendApplicationContribution).toSelf().inSingletonScope();
    rebind(DebugFrontendApplicationContribution).toService(VesDebugFrontendApplicationContribution);
    rebind(DebugConsoleContribution).toConstantValue({
        registerCommands: () => { },
        registerMenus: () => { },
        registerKeybindings: () => { },
        registerToolbarItems: () => { }
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    rebind(DebugPrefixConfiguration).to(VesDebugPrefixConfiguration).inSingletonScope();
    // TODO: remove Preferences->Extensions->Debug (-> bindDebugPreferences)

    // remove plugin frontend feature
    rebind(PluginFrontendViewContribution).toConstantValue({
        registerCommands: () => { },
        registerMenus: () => { },
        registerKeybindings: () => { },
        registerToolbarItems: () => { }
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    rebind(PluginApiFrontendContribution).toConstantValue({
        registerCommands: () => { },
        registerMenus: () => { },
        registerKeybindings: () => { },
        registerToolbarItems: () => { }
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    // remove outline view
    rebind(OutlineViewContribution).toConstantValue({
        registerCommands: () => { },
        registerMenus: () => { },
        registerKeybindings: () => { },
        registerToolbarItems: () => { }
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    // common service
    bind(VesCommonService).toSelf().inSingletonScope();

    // remove call hierarchy
    rebind(CallHierarchyContribution).toConstantValue({
        registerCommands: () => { },
        registerMenus: () => { },
        registerKeybindings: () => { },
        registerToolbarItems: () => { }
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    // git history
    bind(VesScmHistoryContribution).toSelf().inSingletonScope();
    rebind(ScmHistoryContribution).toService(VesScmHistoryContribution);

    // remove "test" view
    bind(VesPluginContribution).toSelf().inSingletonScope();
    rebind(PluginViewRegistry).toService(VesPluginContribution);

    // quick open workspace
    bind(VesQuickOpenWorkspace).toSelf().inSingletonScope();
    rebind(QuickOpenWorkspace).toService(VesQuickOpenWorkspace);

    // workspace service
    bind(VesWorkspaceService).toSelf().inSingletonScope();
    rebind(WorkspaceService).toService(VesWorkspaceService);

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

    // add button to select path to respective settings
    bind(VesPreferenceStringInputRenderer).toSelf();
    rebind(PreferenceStringInputRenderer).to(VesPreferenceStringInputRenderer);

    // initially hide "open editors" tab of navigator
    bind(VesNavigatorWidgetFactory).toSelf();
    rebind(NavigatorWidgetFactory).to(VesNavigatorWidgetFactory);

    // glob service
    bind(VesGlobService).toDynamicValue(ctx => {
        const connection = ctx.container.get(WebSocketConnectionProvider);
        return connection.createProxy<VesGlobService>(VES_GLOB_SERVICE_PATH);
    }).inSingletonScope();
});
