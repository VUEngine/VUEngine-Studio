import { CallHierarchyContribution } from '@theia/callhierarchy/lib/browser/callhierarchy-contribution';
import { CollaborationFrontendContribution } from '@theia/collaboration/lib/browser/collaboration-frontend-contribution';
import { CollaborationWorkspaceService } from '@theia/collaboration/lib/browser/collaboration-workspace-service';
import { CorePreferenceContribution, FilterContribution, PreferenceConfigurations } from '@theia/core';
import {
    ApplicationShell, FrontendApplicationContribution,
    KeybindingContribution,
    LabelProviderContribution
} from '@theia/core/lib/browser';
import { ColorContribution } from '@theia/core/lib/browser/color-application-contribution';
import { EncodingRegistry } from '@theia/core/lib/browser/encoding-registry';
import { DefaultFileIconThemeContribution } from '@theia/core/lib/browser/icon-theme-contribution';
import {
    BrowserMainMenuFactory,
    BrowserMenuBarContribution
} from '@theia/core/lib/browser/menu/browser-menu-plugin';
import { ThemeService } from '@theia/core/lib/browser/theming';
import { CommandContribution } from '@theia/core/lib/common/command';
import { MenuContribution } from '@theia/core/lib/common/menu';
import { ContainerModule, interfaces } from '@theia/core/shared/inversify';
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
import { PreferenceLayoutProvider } from '@theia/preferences/lib/browser/util/preference-layout';
import { PreferenceStringInputRenderer } from '@theia/preferences/lib/browser/views/components/preference-string-input';
import { TestViewContribution } from '@theia/test/lib/browser/view/test-view-contribution';
import { ToolbarDefaultsFactory } from '@theia/toolbar/lib/browser/toolbar-defaults';
import { TypeHierarchyContribution } from '@theia/typehierarchy/lib/browser/typehierarchy-contribution';
import { VSXExtensionsContribution } from '@theia/vsx-registry/lib/browser/vsx-extensions-contribution';
import { QuickOpenWorkspace } from '@theia/workspace/lib/browser/quick-open-workspace';
import '../../../src/core/browser/style/index.css';
import { VesCollaborationFrontendContribution } from './ves-collaboration-frontend-contribution';
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
import { VesFilterContribution } from './ves-filter-contribution';
import { VesFileNavigatorContribution } from './ves-navigator-contribution';
import { VesNavigatorWidgetFactory } from './ves-navigator-widget-factory';
import { VesOutlineViewContribution } from './ves-outline-view-contribution';
import { VesPreferenceConfigurations } from './ves-preference-configurations';
import { VesPreferenceLayoutProvider } from './ves-preference-layout';
import { VesPreferenceStringInputRenderer } from './ves-preference-string-input-renderer';
import './ves-preferences-monaco-contribution';
import { VesQuickOpenWorkspace } from './ves-quick-open-workspace';
import { VesThemeRegistry } from './ves-theme-registry';
import { VesThemeService } from './ves-theme-service';
import { VesToolbarDefaultsOverride } from './ves-toolbar-defaults-override';
import { VesVSXExtensionsContribution } from './ves-vsx-extensions-contribution';
import { VesWorkspaceService } from './ves-workspace-service';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    const removeContribution = (serviceIdentifier: interfaces.ServiceIdentifier) => {
        rebind(serviceIdentifier).toConstantValue({
            registerCommands: () => { },
            registerMenus: () => { },
            registerKeybindings: () => { },
            registerToolbarItems: () => { }
        } as any);
    };

    // rename default icon theme
    // @ts-ignore
    rebind(DefaultFileIconThemeContribution).to(VesDefaultFileIconThemeContribution).inSingletonScope();

    // custom theme colors
    bind(ColorContribution).to(VesColorContribution).inSingletonScope();

    // enable main menu
    rebind(BrowserMainMenuFactory).toSelf().inSingletonScope();
    bind(BrowserMenuBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(BrowserMenuBarContribution);

    // properly initiate compact main menu
    bind(VesCoreCompactMainMenuContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesCoreCompactMainMenuContribution);

    // preferences
    rebind(CorePreferenceContribution).toConstantValue({ schema: VesCorePreferenceSchema });

    // commands, menus and keybindings
    bind(VesCoreContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesCoreContribution);
    bind(MenuContribution).toService(VesCoreContribution);
    bind(KeybindingContribution).toService(VesCoreContribution);

    // default configurations
    rebind(PreferenceConfigurations).to(VesPreferenceConfigurations).inSingletonScope();

    // add custom preference tree categories
    rebind(PreferenceLayoutProvider).to(VesPreferenceLayoutProvider).inSingletonScope();

    // application shell overrides
    rebind(ApplicationShell).to(VesApplicationShell).inSingletonScope();

    // file icons & labels
    bind(LabelProviderContribution).to(VesCoreLabelProviderContribution).inSingletonScope();

    // encoding registry
    bind(VesEncodingRegistry).toSelf().inSingletonScope();
    rebind(EncodingRegistry).toService(VesEncodingRegistry);

    // various removals
    bind(FilterContribution).to(VesFilterContribution).inSingletonScope();

    // remove debug features
    rebind(DebugFrontendApplicationContribution).to(VesDebugFrontendApplicationContribution).inSingletonScope();
    removeContribution(DebugConsoleContribution);
    rebind(DebugPrefixConfiguration).to(VesDebugPrefixConfiguration).inSingletonScope();

    // remove various contributions
    removeContribution(PluginFrontendViewContribution);
    removeContribution(PluginApiFrontendContribution);
    removeContribution(CallHierarchyContribution);
    removeContribution(TestViewContribution);
    removeContribution(TypeHierarchyContribution);

    // common service
    bind(VesCommonService).toSelf().inSingletonScope();

    // custom file extensions
    rebind(FileSystemFrontendContribution).to(VesFileSystemFrontendContribution).inSingletonScope();

    // customize collaboration functionality
    rebind(CollaborationFrontendContribution).to(VesCollaborationFrontendContribution).inSingletonScope();

    // quick open workspace
    rebind(QuickOpenWorkspace).to(VesQuickOpenWorkspace).inSingletonScope();

    // workspace service
    bind(VesWorkspaceService).toSelf().inSingletonScope();
    rebind(CollaborationWorkspaceService).toService(VesWorkspaceService);

    // themes
    rebind(ThemeService).to(VesThemeService).inSingletonScope();
    rebind(MonacoThemeRegistry).to(VesThemeRegistry).inSingletonScope();

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

    // initially hide outline view
    rebind(OutlineViewContribution).to(VesOutlineViewContribution).inSingletonScope();

    // initially open file explorer for workspaces
    rebind(FileNavigatorContribution).to(VesFileNavigatorContribution).inSingletonScope();
});
