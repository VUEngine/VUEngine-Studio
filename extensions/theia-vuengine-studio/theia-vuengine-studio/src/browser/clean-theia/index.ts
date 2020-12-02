import { injectable } from 'inversify';
import { CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry, MAIN_MENU_BAR } from '@theia/core/lib/common';
import { CommonCommands, CommonMenus } from '@theia/core/lib/browser';
import { DebugMenus } from "@theia/debug/lib/browser/debug-frontend-application-contribution";

@injectable()
export class CleanTheiaCommandContribution implements CommandContribution {
    public registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.unregisterCommand(CommonCommands.ABOUT_COMMAND);
    }
}

@injectable()
export class CleanTheiaMenuContribution implements MenuContribution {
    public registerMenus(menuModelRegistry: MenuModelRegistry): void {
        menuModelRegistry.unregisterMenuAction(DebugMenus.DEBUG.slice(-1)[0], MAIN_MENU_BAR);
        menuModelRegistry.unregisterMenuAction(CommonCommands.ABOUT_COMMAND);
        menuModelRegistry.unregisterMenuAction(CommonMenus.HELP[CommonMenus.HELP.length - 1], MAIN_MENU_BAR);
    }
}