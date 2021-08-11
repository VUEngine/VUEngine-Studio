import { remote } from '@theia/core/shared/electron'; /* eslint-disable-line */
import { inject, injectable } from '@theia/core/shared/inversify';
import { CommandContribution, CommandRegistry } from '@theia/core/lib/common/command';
import { MenuContribution, MenuModelRegistry } from '@theia/core/lib/common/menu';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { VesBrandingCommands } from './ves-branding-commands';
import { VesBrandingMenus } from './ves-branding-menus';
import { VesTitlebarWindowControlCommands } from './ves-branding-titlebar-window-controls-commands';
import './ves-branding-themes';

@injectable()
export class VesBrandingContribution implements CommandContribution, MenuContribution {

    @inject(WindowService)
    protected readonly windowService: WindowService;

    static REPORT_ISSUE_URL = 'https://github.com/VUEngine/VUEngine-Studio/issues/new';
    static SUPPORT_URL = 'https://www.patreon.com/VUEngine';

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
