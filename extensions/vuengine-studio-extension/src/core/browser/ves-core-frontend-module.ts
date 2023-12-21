import { CallHierarchyContribution } from '@theia/callhierarchy/lib/browser/callhierarchy-contribution';
import {
    ApplicationShell, CorePreferenceContribution, FrontendApplicationContribution,
    LabelProviderContribution
} from '@theia/core/lib/browser';
import { ColorContribution } from '@theia/core/lib/browser/color-application-contribution';
import { EncodingRegistry } from '@theia/core/lib/browser/encoding-registry';
import { DefaultFileIconThemeContribution } from '@theia/core/lib/browser/icon-theme-contribution';
import {
    BrowserMainMenuFactory,
    BrowserMenuBarContribution
} from '@theia/core/lib/browser/menu/browser-menu-plugin';
import { PreferenceConfigurations } from '@theia/core/lib/browser/preferences/preference-configurations';
import { ThemeService } from '@theia/core/lib/browser/theming';
import { WindowTitleService } from '@theia/core/lib/browser/window/window-title-service';
import { CommandContribution } from '@theia/core/lib/common/command';
import { MenuContribution } from '@theia/core/lib/common/menu';
import { ContainerModule } from '@theia/core/shared/inversify';
import { DebugConsoleContribution } from '@theia/debug/lib/browser/console/debug-console-contribution';
import { DebugFrontendApplicationContribution } from '@theia/debug/lib/browser/debug-frontend-application-contribution';
import { DebugPrefixConfiguration } from '@theia/debug/lib/browser/debug-prefix-configuration';
import { FileSystemFrontendContribution } from '@theia/filesystem/lib/browser/filesystem-frontend-contribution';
import { MonacoThemeRegistry } from '@theia/monaco/lib/browser/textmate/monaco-theme-registry';
import { FileNavigatorContribution } from '@theia/navigator/lib/browser/navigator-contribution';
import { NavigatorWidgetFactory } from '@theia/navigator/lib/browser/navigator-widget-factory';
import { OutlineViewContribution } from '@theia/outline-view/lib/browser/outline-view-contribution';
import { PluginApiFrontendContribution } from '@theia/plugin-ext/lib/main/browser/plugin-frontend-contribution';
import { PluginFrontendViewContribution } from '@theia/plugin-ext/lib/main/browser/plugin-frontend-view-contribution';
import { PreferenceTreeGenerator } from '@theia/preferences/lib/browser/util/preference-tree-generator';
import { PreferenceStringInputRenderer } from '@theia/preferences/lib/browser/views/components/preference-string-input';
import { ScmContribution } from '@theia/scm/lib/browser/scm-contribution';
import { SearchInWorkspaceFrontendContribution } from '@theia/search-in-workspace/lib/browser/search-in-workspace-frontend-contribution';
import { TestViewContribution } from '@theia/test/lib/browser/view/test-view-contribution';
import { ToolbarDefaultsFactory } from '@theia/toolbar/lib/browser/toolbar-defaults';
import { VSXExtensionsContribution } from '@theia/vsx-registry/lib/browser/vsx-extensions-contribution';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { QuickOpenWorkspace } from '@theia/workspace/lib/browser/quick-open-workspace';
import '../../../src/core/browser/style/index.css';
import { VesCommonService } from './ves-common-service';
import { VesApplicationShell } from './ves-core-application-shell';
import { VesColorContribution } from './ves-core-color-contribution';
import { VesCoreCompactMainMenuContribution } from './ves-core-compact-main-menu-contribution';
import { VesCoreContribution } from './ves-core-contribution';
import { VesDebugFrontendApplicationContribution } from './ves-core-debug-contribution';
import { VesDebugPrefixConfiguration } from './ves-core-debug-prefix-configuration';
import { VesDefaultFileIconThemeContribution } from './ves-core-icon-theme-contribution';
import { VesCoreLabelProviderContribution } from './ves-core-label-provider';
import { VesCorePreferenceSchema } from './ves-core-preferences';
import { VesEncodingRegistry } from './ves-encoding-registry';
import { VesFileSystemFrontendContribution } from './ves-filesystem-frontend-contribution';
import { VesFileNavigatorContribution } from './ves-navigator-contribution';
import { VesNavigatorWidgetFactory } from './ves-navigator-widget-factory';
import { VesPreferenceConfigurations } from './ves-preference-configurations';
import { VesPreferenceStringInputRenderer } from './ves-preference-string-input-renderer';
import { VesPreferenceTreeGenerator } from './ves-preference-tree-generator';
import './ves-preferences-monaco-contribution';
import { VesQuickOpenWorkspace } from './ves-quick-open-workspace';
import { VesScmContribution } from './ves-scm-contribution';
import { VesSearchInWorkspaceFrontendContribution } from './ves-search-in-workspace-frontend-contribution';
import { VesThemeRegistry } from './ves-theme-registry';
import { VesThemeService } from './ves-theme-service';
import { VesToolbarDefaultsOverride } from './ves-toolbar-defaults-override';
import { VesVSXExtensionsContribution } from './ves-vsx-extensions-contribution';
import { VesWindowTitleService } from './ves-window-title-service';
import { VesWorkspaceService } from './ves-workspace-service';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // rename default icon theme
    // @ts-ignore
    rebind(DefaultFileIconThemeContribution).to(VesDefaultFileIconThemeContribution).inSingletonScope();

    // custom theme colors
    bind(ColorContribution).to(VesColorContribution).inSingletonScope();

    // enable main menu
    bind(BrowserMainMenuFactory).toSelf().inSingletonScope();
    bind(BrowserMenuBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(BrowserMenuBarContribution);

    // properly initiate compact main menu
    bind(VesCoreCompactMainMenuContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesCoreCompactMainMenuContribution);

    // preferences
    rebind(CorePreferenceContribution).toConstantValue({ schema: VesCorePreferenceSchema });

    // commands and menus
    bind(VesCoreContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesCoreContribution);
    bind(MenuContribution).toService(VesCoreContribution);

    // default configurations
    rebind(PreferenceConfigurations).to(VesPreferenceConfigurations).inSingletonScope();

    // add custom preference tree categories
    rebind(PreferenceTreeGenerator).to(VesPreferenceTreeGenerator).inSingletonScope();

    // application shell overrides
    rebind(ApplicationShell).to(VesApplicationShell).inSingletonScope();

    // file icons & labels
    bind(LabelProviderContribution).to(VesCoreLabelProviderContribution).inSingletonScope();

    // encoding registry
    bind(VesEncodingRegistry).toSelf().inSingletonScope();
    rebind(EncodingRegistry).toService(VesEncodingRegistry);

    // remove debug features
    rebind(DebugFrontendApplicationContribution).to(VesDebugFrontendApplicationContribution).inSingletonScope();
    rebind(DebugConsoleContribution).toConstantValue({
        registerCommands: () => { },
        registerMenus: () => { },
        registerKeybindings: () => { },
        registerToolbarItems: () => { }
    } as any);
    rebind(DebugPrefixConfiguration).to(VesDebugPrefixConfiguration).inSingletonScope();
    // TODO: remove Preferences->Extensions->Debug (-> bindDebugPreferences)

    // remove plugin frontend feature
    rebind(PluginFrontendViewContribution).toConstantValue({
        registerCommands: () => { },
        registerMenus: () => { },
        registerKeybindings: () => { },
        registerToolbarItems: () => { }
    } as any);
    rebind(PluginApiFrontendContribution).toConstantValue({
        registerCommands: () => { },
        registerMenus: () => { },
        registerKeybindings: () => { },
        registerToolbarItems: () => { }
    } as any);

    // remove outline view
    rebind(OutlineViewContribution).toConstantValue({
        registerCommands: () => { },
        registerMenus: () => { },
        registerKeybindings: () => { },
        registerToolbarItems: () => { }
    } as any);

    // common service
    bind(VesCommonService).toSelf().inSingletonScope();

    // remove call hierarchy
    rebind(CallHierarchyContribution).toConstantValue({
        registerCommands: () => { },
        registerMenus: () => { },
        registerKeybindings: () => { },
        registerToolbarItems: () => { }
    } as any);

    // custom file extensions
    rebind(FileSystemFrontendContribution).to(VesFileSystemFrontendContribution).inSingletonScope();

    // remove test view
    rebind(TestViewContribution).toConstantValue({
        registerCommands: () => { },
        registerMenus: () => { },
        registerKeybindings: () => { },
        registerToolbarItems: () => { }
    } as any);

    // quick open workspace
    rebind(QuickOpenWorkspace).to(VesQuickOpenWorkspace).inSingletonScope();

    // workspace service
    rebind(WorkspaceService).to(VesWorkspaceService).inSingletonScope();

    // themes
    rebind(ThemeService).to(VesThemeService).inSingletonScope();
    rebind(MonacoThemeRegistry).to(VesThemeRegistry).inSingletonScope();

    // window title service
    rebind(WindowTitleService).to(VesWindowTitleService).inSingletonScope();

    // toolbar default config
    rebind(ToolbarDefaultsFactory).toConstantValue(VesToolbarDefaultsOverride);

    // add select path button to respective settings
    bind(VesPreferenceStringInputRenderer).toSelf();
    rebind(PreferenceStringInputRenderer).to(VesPreferenceStringInputRenderer);

    // initially hide "open editors" tab of navigator
    bind(VesNavigatorWidgetFactory).toSelf();
    rebind(NavigatorWidgetFactory).to(VesNavigatorWidgetFactory);

    // initially hide extensions widget
    rebind(VSXExtensionsContribution).to(VesVSXExtensionsContribution).inSingletonScope();

    // initially open file explorer for workspaces, hide otherwise
    rebind(FileNavigatorContribution).to(VesFileNavigatorContribution).inSingletonScope();

    // initially hide search and git widgets if no workspace is opened
    rebind(SearchInWorkspaceFrontendContribution).to(VesSearchInWorkspaceFrontendContribution).inSingletonScope();
    rebind(ScmContribution).to(VesScmContribution).inSingletonScope();
});
