import { CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry, MenuPath, QuickPickItem, QuickPickOptions, QuickPickService } from '@theia/core';
import { CommonMenus, KeybindingContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { SearchInWorkspaceCommands } from '@theia/search-in-workspace/lib/browser/search-in-workspace-frontend-contribution';
import { VSXCommands } from '@theia/vsx-registry/lib/browser/vsx-extensions-contribution';
import { ViewModeCommands } from './view-mode-commands';
import { ViewModeService } from './view-mode-service';
import { DISABLED_VIEW_MODES, VIEW_MODE_ICONS, VIEW_MODE_LABELS, ViewMode } from './view-mode-types';
import { WorkspaceService } from '@theia/workspace/lib/browser';

export const VIEW_VIEW_MODE = [...CommonMenus.VIEW, '1_viewMode'];

export const VIEW_MODE_MENU: MenuPath = ['viewModeMenu'];
export namespace ViewModeMenuSection {
    export const TYPES = [...VIEW_MODE_MENU, '1_types'];
    export const OTHER = [...VIEW_MODE_MENU, '2_other'];
}

@injectable()
export class ViewModeContribution implements CommandContribution, KeybindingContribution, MenuContribution {
    @inject(CommandRegistry)
    protected readonly commands: CommandRegistry;
    @inject(QuickPickService)
    protected readonly quickPickService: QuickPickService;
    @inject(ViewModeService)
    protected readonly viewModeService: ViewModeService;
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.registerCommand(ViewModeCommands.CHANGE_VIEW_MODE, {
            isEnabled: () => this.workspaceService.opened,
            execute: () => this.viewModeQuickPick()
        });
        commandRegistry.registerCommand(ViewModeCommands.SWITCH_TO_ACTORS_VIEW_MODE, {
            isEnabled: () => this.workspaceService.opened && !DISABLED_VIEW_MODES.includes(ViewMode.actors),
            execute: () => this.viewModeService.setViewMode(ViewMode.actors)
        });
        commandRegistry.registerCommand(ViewModeCommands.SWITCH_TO_ASSETS_VIEW_MODE, {
            isEnabled: () => this.workspaceService.opened && !DISABLED_VIEW_MODES.includes(ViewMode.assets),
            execute: () => this.viewModeService.setViewMode(ViewMode.assets)
        });
        commandRegistry.registerCommand(ViewModeCommands.SWITCH_TO_BUILD_VIEW_MODE, {
            isEnabled: () => this.workspaceService.opened && !DISABLED_VIEW_MODES.includes(ViewMode.build),
            execute: () => this.viewModeService.setViewMode(ViewMode.build)
        });
        commandRegistry.registerCommand(ViewModeCommands.SWITCH_TO_FONTS_VIEW_MODE, {
            isEnabled: () => this.workspaceService.opened && !DISABLED_VIEW_MODES.includes(ViewMode.fonts),
            execute: () => this.viewModeService.setViewMode(ViewMode.fonts)
        });
        commandRegistry.registerCommand(ViewModeCommands.SWITCH_TO_LOCALIZATION_VIEW_MODE, {
            isEnabled: () => this.workspaceService.opened && !DISABLED_VIEW_MODES.includes(ViewMode.localization),
            execute: () => this.viewModeService.setViewMode(ViewMode.localization)
        });
        commandRegistry.registerCommand(ViewModeCommands.SWITCH_TO_LOGIC_VIEW_MODE, {
            isEnabled: () => this.workspaceService.opened && !DISABLED_VIEW_MODES.includes(ViewMode.logic),
            execute: () => this.viewModeService.setViewMode(ViewMode.logic)
        });
        commandRegistry.registerCommand(ViewModeCommands.SWITCH_TO_SETTINGS_VIEW_MODE, {
            isEnabled: () => this.workspaceService.opened && !DISABLED_VIEW_MODES.includes(ViewMode.settings),
            execute: () => this.viewModeService.setViewMode(ViewMode.settings)
        });
        commandRegistry.registerCommand(ViewModeCommands.SWITCH_TO_SOUND_VIEW_MODE, {
            isEnabled: () => this.workspaceService.opened && !DISABLED_VIEW_MODES.includes(ViewMode.sound),
            execute: () => this.viewModeService.setViewMode(ViewMode.sound)
        });
        commandRegistry.registerCommand(ViewModeCommands.SWITCH_TO_SOURCE_CODE_VIEW_MODE, {
            isEnabled: () => this.workspaceService.opened && !DISABLED_VIEW_MODES.includes(ViewMode.sourceCode),
            execute: () => this.viewModeService.setViewMode(ViewMode.sourceCode)
        });
        commandRegistry.registerCommand(ViewModeCommands.SWITCH_TO_STAGES_VIEW_MODE, {
            isEnabled: () => this.workspaceService.opened && !DISABLED_VIEW_MODES.includes(ViewMode.stages),
            execute: () => this.viewModeService.setViewMode(ViewMode.stages)
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybindings({
            command: ViewModeCommands.CHANGE_VIEW_MODE.id,
            keybinding: 'ctrlcmd+m'
        });
        registry.registerKeybindings({
            command: ViewModeCommands.SWITCH_TO_STAGES_VIEW_MODE.id,
            keybinding: 'ctrlcmd+1'
        });
        registry.registerKeybindings({
            command: ViewModeCommands.SWITCH_TO_ACTORS_VIEW_MODE.id,
            keybinding: 'ctrlcmd+2'
        });
        registry.registerKeybindings({
            command: ViewModeCommands.SWITCH_TO_SOUND_VIEW_MODE.id,
            keybinding: 'ctrlcmd+3'
        });
        registry.registerKeybindings({
            command: ViewModeCommands.SWITCH_TO_FONTS_VIEW_MODE.id,
            keybinding: 'ctrlcmd+4'
        });
        registry.registerKeybindings({
            command: ViewModeCommands.SWITCH_TO_ASSETS_VIEW_MODE.id,
            keybinding: 'ctrlcmd+5'
        });
        registry.registerKeybindings({
            command: ViewModeCommands.SWITCH_TO_LOGIC_VIEW_MODE.id,
            keybinding: 'ctrlcmd+6'
        });
        registry.registerKeybindings({
            command: ViewModeCommands.SWITCH_TO_LOCALIZATION_VIEW_MODE.id,
            keybinding: 'ctrlcmd+7'
        });
        registry.registerKeybindings({
            command: ViewModeCommands.SWITCH_TO_SOURCE_CODE_VIEW_MODE.id,
            keybinding: 'ctrlcmd+8'
        });
        registry.registerKeybindings({
            command: ViewModeCommands.SWITCH_TO_BUILD_VIEW_MODE.id,
            keybinding: 'ctrlcmd+9'
        });
        registry.registerKeybindings({
            command: ViewModeCommands.SWITCH_TO_SETTINGS_VIEW_MODE.id,
            keybinding: 'ctrlcmd+0'
        });
    }

    unregisterMenus(menus: MenuModelRegistry): void {
        menus.getMenu(CommonMenus.VIEW_VIEWS)?.children.forEach(c => {
            menus.unregisterMenuAction(c.id, CommonMenus.VIEW_VIEWS);
        });
        menus.unregisterMenuAction(VSXCommands.TOGGLE_EXTENSIONS.id, CommonMenus.VIEW_VIEWS);
        menus.unregisterMenuAction('outlineView:toggle', CommonMenus.VIEW_VIEWS);
        menus.unregisterMenuAction('problemsView:toggle', CommonMenus.VIEW_VIEWS);
        menus.unregisterMenuAction(SearchInWorkspaceCommands.TOGGLE_SIW_WIDGET.id, CommonMenus.VIEW_VIEWS);
    }

    registerMenus(menus: MenuModelRegistry): void {
        this.unregisterMenus(menus);

        [
            ViewModeMenuSection.TYPES,
            VIEW_VIEW_MODE,
        ].forEach(menuSection => {
            menus.registerMenuAction(menuSection, {
                commandId: ViewModeCommands.SWITCH_TO_STAGES_VIEW_MODE.id,
                label: VIEW_MODE_LABELS[ViewMode.stages],
                order: 'a1'
            });
            menus.registerMenuAction(menuSection, {
                commandId: ViewModeCommands.SWITCH_TO_ACTORS_VIEW_MODE.id,
                label: VIEW_MODE_LABELS[ViewMode.actors],
                order: 'a2'
            });
            menus.registerMenuAction(menuSection, {
                commandId: ViewModeCommands.SWITCH_TO_SOUND_VIEW_MODE.id,
                label: VIEW_MODE_LABELS[ViewMode.sound],
                order: 'a3'
            });
            menus.registerMenuAction(menuSection, {
                commandId: ViewModeCommands.SWITCH_TO_FONTS_VIEW_MODE.id,
                label: VIEW_MODE_LABELS[ViewMode.fonts],
                order: 'a4'
            });
            menus.registerMenuAction(menuSection, {
                commandId: ViewModeCommands.SWITCH_TO_ASSETS_VIEW_MODE.id,
                label: VIEW_MODE_LABELS[ViewMode.assets],
                order: 'a5'
            });
            menus.registerMenuAction(menuSection, {
                commandId: ViewModeCommands.SWITCH_TO_LOGIC_VIEW_MODE.id,
                label: VIEW_MODE_LABELS[ViewMode.logic],
                order: 'a6'
            });
            menus.registerMenuAction(menuSection, {
                commandId: ViewModeCommands.SWITCH_TO_LOCALIZATION_VIEW_MODE.id,
                label: VIEW_MODE_LABELS[ViewMode.localization],
                order: 'a7'
            });
            menus.registerMenuAction(menuSection, {
                commandId: ViewModeCommands.SWITCH_TO_SOURCE_CODE_VIEW_MODE.id,
                label: VIEW_MODE_LABELS[ViewMode.sourceCode],
                order: 'a8'
            });
        });
        [
            ViewModeMenuSection.OTHER,
            VIEW_VIEW_MODE,
        ].forEach(menuSection => {
            menus.registerMenuAction(menuSection, {
                commandId: ViewModeCommands.SWITCH_TO_BUILD_VIEW_MODE.id,
                label: VIEW_MODE_LABELS[ViewMode.build],
                order: 'b1'
            });
            menus.registerMenuAction(menuSection, {
                commandId: ViewModeCommands.SWITCH_TO_SETTINGS_VIEW_MODE.id,
                label: VIEW_MODE_LABELS[ViewMode.settings],
                order: 'c1'
            });
        });
    }

    protected async viewModeQuickPick(): Promise<void> {
        const quickPickOptions: QuickPickOptions<QuickPickItem> = {
            title: ViewModeCommands.CHANGE_VIEW_MODE.label,
        };

        const viewModeOptions: QuickPickItem[] = Object.keys(ViewMode)
            .filter(vm => vm !== ViewMode.welcome)
            .filter(vm => !DISABLED_VIEW_MODES.includes(vm as ViewMode))
            .map(vm => ({
                id: vm,
                label: VIEW_MODE_LABELS[vm],
                iconClasses: VIEW_MODE_ICONS[vm].split(' '),
            }))
            .sort((a, b) => a.label.localeCompare(b.label));

        const selection = await this.quickPickService.show<QuickPickItem>(viewModeOptions, quickPickOptions);
        if (!selection) {
            return;
        }
        this.viewModeService.setViewMode(selection.id as ViewMode);
    }
}
