import { CommandRegistry, CommandService, MenuModelRegistry } from '@theia/core';
import { AbstractViewContribution, CommonCommands, CommonMenus, FrontendApplication, KeybindingRegistry } from '@theia/core/lib/browser';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesCoreCommands } from '../../core/browser/ves-core-commands';
import { VesFlashCartCommands } from './ves-flash-cart-commands';
import { VesFlashCartService } from './ves-flash-cart-service';
import { VesFlashCartWidget } from './ves-flash-cart-widget';

@injectable()
export class VesFlashCartViewContribution extends AbstractViewContribution<VesFlashCartWidget> implements TabBarToolbarContribution {
    @inject(CommandService)
    private readonly commandService: CommandService;
    @inject(VesFlashCartService)
    private readonly vesFlashCartService: VesFlashCartService;

    constructor() {
        super({
            widgetId: VesFlashCartWidget.ID,
            widgetName: VesFlashCartWidget.LABEL,
            defaultWidgetOptions: {
                area: 'right',
                rank: 900,
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: false, reveal: false });
    }

    async registerCommands(commandRegistry: CommandRegistry): Promise<void> {
        super.registerCommands(commandRegistry);

        commandRegistry.registerCommand(VesFlashCartCommands.WIDGET_TOGGLE, {
            execute: () => this.toggleView()
        });

        commandRegistry.registerCommand(VesFlashCartCommands.WIDGET_EXPAND, {
            isEnabled: () => true,
            isVisible: widget => widget !== undefined &&
                widget.id === VesFlashCartWidget.ID,
            execute: async widget => widget !== undefined &&
                widget.id === VesFlashCartWidget.ID &&
                await this.openView({ activate: true, reveal: true }) &&
                this.commandService.executeCommand(CommonCommands.TOGGLE_MAXIMIZED.id)
        });

        commandRegistry.registerCommand(VesFlashCartCommands.WIDGET_HELP, {
            isEnabled: () => true,
            isVisible: widget => widget !== undefined &&
                widget.id !== undefined &&
                widget.id === VesFlashCartWidget.ID,
            execute: () => this.commandService.executeCommand(VesCoreCommands.OPEN_DOCUMENTATION.id, 'user-guide/flash-carts', false),
        });

        commandRegistry.registerCommand(VesFlashCartCommands.WIDGET_SETTINGS, {
            isEnabled: () => true,
            isVisible: widget => widget !== undefined &&
                widget.id === VesFlashCartWidget.ID,
            execute: () => this.commandService.executeCommand(CommonCommands.OPEN_PREFERENCES.id, 'flash carts'),
        });

        commandRegistry.registerCommand(VesFlashCartCommands.WIDGET_REFRESH, {
            isEnabled: () => true,
            isVisible: widget => widget !== undefined &&
                widget.id !== undefined &&
                widget.id === VesFlashCartWidget.ID,
            execute: () => this.vesFlashCartService.detectConnectedFlashCarts(),
        });
    }

    async registerToolbarItems(toolbar: TabBarToolbarRegistry): Promise<void> {
        toolbar.registerItem({
            id: VesFlashCartCommands.WIDGET_EXPAND.id,
            command: VesFlashCartCommands.WIDGET_EXPAND.id,
            tooltip: VesFlashCartCommands.WIDGET_EXPAND.label,
            priority: 1,
        });
        toolbar.registerItem({
            id: VesFlashCartCommands.WIDGET_SETTINGS.id,
            command: VesFlashCartCommands.WIDGET_SETTINGS.id,
            tooltip: VesFlashCartCommands.WIDGET_SETTINGS.label,
            priority: 2,
        });
        toolbar.registerItem({
            id: VesFlashCartCommands.WIDGET_HELP.id,
            command: VesFlashCartCommands.WIDGET_HELP.id,
            tooltip: VesFlashCartCommands.WIDGET_HELP.label,
            priority: 3,
        });
        toolbar.registerItem({
            id: VesFlashCartCommands.WIDGET_REFRESH.id,
            command: VesFlashCartCommands.WIDGET_REFRESH.id,
            tooltip: VesFlashCartCommands.WIDGET_REFRESH.label,
            priority: 4,
        });
    }

    async registerMenus(menus: MenuModelRegistry): Promise<void> {
        super.registerMenus(menus);

        menus.registerMenuAction(CommonMenus.VIEW_VIEWS, {
            commandId: VesFlashCartCommands.WIDGET_TOGGLE.id,
            label: this.viewLabel
        });
    }

    async registerKeybindings(keybindings: KeybindingRegistry): Promise<void> {
        super.registerKeybindings(keybindings);

        keybindings.registerKeybinding({
            command: VesFlashCartCommands.WIDGET_TOGGLE.id,
            keybinding: 'ctrlcmd+shift+k'
        });
    }
}
