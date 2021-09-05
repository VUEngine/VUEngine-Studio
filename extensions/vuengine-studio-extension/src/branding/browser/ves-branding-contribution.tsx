import { remote } from '@theia/core/shared/electron'; /* eslint-disable-line */
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { CommandContribution, CommandRegistry } from '@theia/core/lib/common/command';
import { MenuContribution, MenuModelRegistry } from '@theia/core/lib/common/menu';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { VesBrandingCommands } from './ves-branding-commands';
import { VesBrandingMenus } from './ves-branding-menus';
import { VesTitlebarWindowControlCommands } from './ves-branding-titlebar-window-controls-commands';
import { BuiltinThemeProvider, ThemeService } from '@theia/core/lib/browser/theming';
import { MonacoThemeRegistry } from '@theia/monaco/lib/browser/textmate/monaco-theme-registry';

@injectable()
export class VesBrandingContribution implements CommandContribution, MenuContribution {

    @inject(ThemeService)
    protected readonly themeService: ThemeService;
    @inject(WindowService)
    protected readonly windowService: WindowService;

    static REPORT_ISSUE_URL = 'https://github.com/VUEngine/VUEngine-Studio/issues/new';
    static SUPPORT_URL = 'https://www.patreon.com/VUEngine';

    @postConstruct()
    initThemes(): void {
        // @ref https://github.com/eclipse-theia/theia/blob/master/packages/core/src/browser/theming.ts
        // @ref https://github.com/eclipse-theia/theia/blob/master/packages/monaco/src/browser/textmate/monaco-theme-registry.ts

        // Override Light Theme
        MonacoThemeRegistry.SINGLETON.register({
            ...require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/light_theia.json'),
            ...require('../../../src/branding/browser/themes/vuengine-light-color-theme.json'),
        }, {
            './light_defaults.json': require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/light_defaults.json'),
            './light_vs.json': require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/light_vs.json'),
            './light_plus.json': require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/light_plus.json')
        }, 'light-vuengine-studio', 'vs');

        this.themeService.register({
            id: 'light',
            type: 'light',
            label: 'Light',
            editorTheme: 'light-vuengine-studio',
            activate(): void {
                BuiltinThemeProvider.lightCss.use();
            },
            deactivate(): void {
                BuiltinThemeProvider.lightCss.unuse();
            }
        });

        // Override Dark Theme
        MonacoThemeRegistry.SINGLETON.register({
            ...require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/dark_theia.json'),
            ...require('../../../src/branding/browser/themes/vuengine-dark-color-theme.json'),
        }, {
            './dark_defaults.json': require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/dark_defaults.json'),
            './dark_vs.json': require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/dark_vs.json'),
            './dark_plus.json': require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/dark_plus.json')
        }, 'dark-vuengine-studio', 'vs-dark');

        this.themeService.register({
            id: 'dark',
            type: 'dark',
            label: 'Dark',
            editorTheme: 'dark-vuengine-studio',
            activate(): void {
                BuiltinThemeProvider.darkCss.use();
            },
            deactivate(): void {
                BuiltinThemeProvider.darkCss.unuse();
            }
        });

        // Override HC Theme
        MonacoThemeRegistry.SINGLETON.register({
            ...require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/hc_theia.json'),
            ...require('../../../src/branding/browser/themes/vuengine-high-contrast-color-theme.json'),
        }, {
            './hc_black_defaults.json': require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/hc_black_defaults.json'),
            './hc_black.json': require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/hc_black.json')
        }, 'hc-vuengine-studio', 'hc-black').name!;

        this.themeService.register({
            id: 'hc-theia',
            type: 'hc',
            label: 'High Contrast',
            editorTheme: 'hc-vuengine-studio',
            activate(): void {
                BuiltinThemeProvider.darkCss.use();
            },
            deactivate(): void {
                BuiltinThemeProvider.darkCss.unuse();
            }
        });

        // Add Virtual Boy HC theme
        // this is implemented through a filter in style/virtual-boy-theme.css
        MonacoThemeRegistry.SINGLETON.register({
            ...require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/hc_theia.json'),
            ...require('../../../src/branding/browser/themes/vuengine-virtual-boy-color-theme.json'),
        }, {
            './hc_black_defaults.json': require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/hc_black_defaults.json'),
            './hc_black.json': require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/hc_black.json')
        }, 'hc-virtual-boy', 'hc-black').name!;

        this.themeService.register({
            id: 'virtual-boy',
            type: 'hc',
            label: 'Virtual Boy',
            editorTheme: 'hc-virtual-boy',
            activate(): void {
                BuiltinThemeProvider.darkCss.use();
            },
            deactivate(): void {
                BuiltinThemeProvider.darkCss.unuse();
            }
        });
    }

    registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.registerCommand(VesBrandingCommands.REPORT_ISSUE, {
            execute: () => this.windowService.openNewWindow(VesBrandingContribution.REPORT_ISSUE_URL, { external: true })
        });
        commandRegistry.registerCommand(VesBrandingCommands.SUPPORT, {
            execute: () => this.windowService.openNewWindow(VesBrandingContribution.SUPPORT_URL, { external: true })
        });

        commandRegistry.registerCommand(VesTitlebarWindowControlCommands.MINIMIZE, {
            execute: () => remote.getCurrentWindow().minimize()
        });
        commandRegistry.registerCommand(VesTitlebarWindowControlCommands.MAXIMIZE, {
            execute: () => remote.getCurrentWindow().maximize()
        });
        commandRegistry.registerCommand(VesTitlebarWindowControlCommands.UNMAXIMIZE, {
            execute: () => remote.getCurrentWindow().unmaximize()
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(VesBrandingMenus.VES_HELP, {
            commandId: VesBrandingCommands.REPORT_ISSUE.id,
            label: VesBrandingCommands.REPORT_ISSUE.label,
            order: '1',
        });
        menus.registerMenuAction(VesBrandingMenus.VES_HELP, {
            commandId: VesBrandingCommands.SUPPORT.id,
            label: VesBrandingCommands.SUPPORT.label,
            order: '3',
        });
    }
}
