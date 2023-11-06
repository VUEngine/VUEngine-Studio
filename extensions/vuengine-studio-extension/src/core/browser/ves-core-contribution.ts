import { ApplicationShell, PreferenceService } from '@theia/core/lib/browser';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { CommandContribution, CommandRegistry } from '@theia/core/lib/common/command';
import { MenuContribution, MenuModelRegistry } from '@theia/core/lib/common/menu';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesCoreCommands } from './ves-core-commands';
import { VesCoreMenus } from './ves-core-menus';

@injectable()
export class VesCoreContribution implements CommandContribution, MenuContribution {
    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;
    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;
    @inject(WindowService)
    protected readonly windowService: WindowService;

    static REPORT_ISSUE_URL = 'https://github.com/VUEngine/VUEngine-Studio/issues/new';
    static SUPPORT_URL = 'https://www.patreon.com/VUEngine';
    static DOCUMENTATION_URL = 'https://www.vuengine.dev/documentation/';

    registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.registerCommand(VesCoreCommands.REPORT_ISSUE, {
            execute: () => this.windowService.openNewWindow(VesCoreContribution.REPORT_ISSUE_URL, { external: true })
        });
        commandRegistry.registerCommand(VesCoreCommands.SUPPORT, {
            execute: () => this.windowService.openNewWindow(VesCoreContribution.SUPPORT_URL, { external: true })
        });
        commandRegistry.registerCommand(VesCoreCommands.OPEN_DOCUMENTATION, {
            execute: path => this.windowService.openNewWindow(`${VesCoreContribution.DOCUMENTATION_URL}${path ? path : ''}`, { external: true })
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
