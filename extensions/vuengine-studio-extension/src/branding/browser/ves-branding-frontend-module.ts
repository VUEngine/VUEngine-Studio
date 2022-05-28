import { CallHierarchyContribution } from '@theia/callhierarchy/lib/browser/callhierarchy-contribution';
import {
    ApplicationShell, FrontendApplicationContribution,
    LabelProviderContribution, WebSocketConnectionProvider
} from '@theia/core/lib/browser';
import { ColorContribution } from '@theia/core/lib/browser/color-application-contribution';
import { DefaultFileIconThemeContribution } from '@theia/core/lib/browser/icon-theme-contribution';
import {
    BrowserMainMenuFactory,
    BrowserMenuBarContribution
} from '@theia/core/lib/browser/menu/browser-menu-plugin';
import { PreferenceConfigurations } from '@theia/core/lib/browser/preferences/preference-configurations';
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
import { ToolbarDefaultsFactory } from '@theia/toolbar/lib/browser/toolbar-defaults';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { QuickOpenWorkspace } from '@theia/workspace/lib/browser/quick-open-workspace';
import '../../../src/branding/browser/style/index.css';
import { VesGlobService, VES_GLOB_SERVICE_PATH } from '../common/ves-glob-service-protocol';
import { VesApplicationShell } from './ves-branding-application-shell';
import { VesColorContribution } from './ves-branding-color-contribution';
import { VesBrandingContribution } from './ves-branding-contribution';
import { VesDebugFrontendApplicationContribution } from './ves-branding-debug-contribution';
import { VesDebugPrefixConfiguration } from './ves-branding-debug-prefix-configuration';
import { VesScmHistoryContribution } from './ves-branding-history-contribution';
import { VesDefaultFileIconThemeContribution } from './ves-branding-icon-theme-contribution';
import { VesBrandingLabelProviderContribution } from './ves-branding-label-provider';
import { VesPluginContribution } from './ves-branding-plugin-contribution';
import { VesPreferenceConfigurations } from './ves-branding-preference-configurations';
import { VesPreferenceTreeGenerator } from './ves-branding-preference-tree-generator.';
import { VesToolbarDefaultsOverride } from './ves-branding-toolbar-defaults-override';
import { VesCommonService } from './ves-common-service';
import { VesNavigatorWidgetFactory } from './ves-navigator-widget-factory';
import { VesPreferenceStringInputRenderer } from './ves-preference-string-input-renderer';
import { VesQuickOpenWorkspace } from './ves-quick-open-workspace';
import { VesWorkspaceService } from './ves-workspace-service';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
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

    // toolbar default config
    rebind(ToolbarDefaultsFactory).toConstantValue(VesToolbarDefaultsOverride);

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
