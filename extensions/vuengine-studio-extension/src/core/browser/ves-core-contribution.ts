import { MAIN_MENU_BAR, nls } from '@theia/core';
import { ApplicationShell, PreferenceService } from '@theia/core/lib/browser';
import { BuiltinThemeProvider, ThemeService } from '@theia/core/lib/browser/theming';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { CommandContribution, CommandRegistry } from '@theia/core/lib/common/command';
import { MenuContribution, MenuModelRegistry } from '@theia/core/lib/common/menu';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { MonacoThemeRegistry } from '@theia/monaco/lib/browser/textmate/monaco-theme-registry';
import { VesCoreCommands } from './ves-core-commands';
import { VesCoreMenus } from './ves-core-menus';

@injectable()
export class VesCoreContribution implements CommandContribution, MenuContribution {
    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;
    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;
    @inject(ThemeService)
    protected readonly themeService: ThemeService;
    @inject(WindowService)
    protected readonly windowService: WindowService;

    static REPORT_ISSUE_URL = 'https://github.com/VUEngine/VUEngine-Studio/issues/new';
    static SUPPORT_URL = 'https://www.patreon.com/VUEngine';

    @postConstruct()
    init(): void {
        this.initMenubar();
        this.initThemes();
    }

    initMenubar(): void {
        // work around Theia bug with main menu not being initialized when the default
        // value is "compact"
        const menuBarVisibility = this.preferenceService.get('window.menuBarVisibility');
        if (menuBarVisibility === 'compact') {
            this.shell.leftPanelHandler.addTopMenu({
                id: 'main-menu',
                iconClass: 'codicon codicon-menu',
                title: nls.localizeByDefault('Application Menu'),
                menuPath: MAIN_MENU_BAR,
                order: 0,
            });
        }
    }

    initThemes(): void {
        // @ref https://github.com/eclipse-theia/theia/blob/master/packages/core/src/browser/theming.ts
        // @ref https://github.com/eclipse-theia/theia/blob/master/packages/monaco/src/browser/textmate/monaco-theme-registry.ts

        // Override Light Theme
        MonacoThemeRegistry.SINGLETON.register({
            ...require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/light_theia.json'),
            ...require('../../../themes/vuengine-light-color-theme.json'),
        }, {
            './light_vs.json': require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/light_vs.json'),
            './light_plus.json': require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/light_plus.json')
        }, 'light-vuengine-studio', 'vs');

        this.themeService.register({
            id: 'light',
            type: 'light',
            label: nls.localize('vuengine/general/themes/light', 'Light'),
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
            ...require('../../../themes/vuengine-dark-color-theme.json'),
        }, {
            './dark_vs.json': require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/dark_vs.json'),
            './dark_plus.json': require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/dark_plus.json')
        }, 'dark-vuengine-studio', 'vs-dark');

        this.themeService.register({
            id: 'dark',
            type: 'dark',
            label: nls.localize('vuengine/general/themes/dark', 'Dark'),
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
            ...require('../../../themes/vuengine-high-contrast-color-theme.json'),
        }, {
            './hc_black.json': require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/hc_black.json')
        }, 'hc-vuengine-studio', 'hc-black').name!;

        this.themeService.register({
            id: 'hc-theia',
            type: 'hc',
            label: nls.localize('vuengine/general/themes/highContrast', 'High Contrast'),
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
        // TODO: Exclude certain areas from filter, such as the emulator
        MonacoThemeRegistry.SINGLETON.register({
            ...require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/hc_theia.json'),
            ...require('../../../themes/vuengine-virtual-boy-color-theme.json'),
        }, {
            './hc_black.json': require('../../../../../node_modules/@theia/monaco/data/monaco-themes/vscode/hc_black.json')
        }, 'hc-virtual-boy', 'hc-black').name!;

        this.themeService.register({
            id: 'virtual-boy',
            type: 'hc',
            label: nls.localize('vuengine/general/themes/virtualBoy', 'Virtual Boy'),
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
        commandRegistry.registerCommand(VesCoreCommands.REPORT_ISSUE, {
            execute: () => this.windowService.openNewWindow(VesCoreContribution.REPORT_ISSUE_URL, { external: true })
        });
        commandRegistry.registerCommand(VesCoreCommands.SUPPORT, {
            execute: () => this.windowService.openNewWindow(VesCoreContribution.SUPPORT_URL, { external: true })
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(VesCoreMenus.VES_HELP, {
            commandId: VesCoreCommands.REPORT_ISSUE.id,
            label: VesCoreCommands.REPORT_ISSUE.label,
            order: '1',
        });
        menus.registerMenuAction(VesCoreMenus.VES_HELP, {
            commandId: VesCoreCommands.SUPPORT.id,
            label: VesCoreCommands.SUPPORT.label,
            order: '3',
        });
    }
}