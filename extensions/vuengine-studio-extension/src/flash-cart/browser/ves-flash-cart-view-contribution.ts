import { CommandRegistry, CommandService } from '@theia/core';
import { AbstractViewContribution, CommonCommands } from '@theia/core/lib/browser';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesCoreCommands } from '../../core/browser/ves-core-commands';
import { ViewModeService } from '../../viewMode/browser/view-mode-service';
import { ViewMode } from '../../viewMode/browser/view-mode-types';
import { VesFlashCartCommands } from './ves-flash-cart-commands';
import { VesFlashCartService } from './ves-flash-cart-service';
import { VesFlashCartWidget } from './ves-flash-cart-widget';

@injectable()
export class VesFlashCartViewContribution extends AbstractViewContribution<VesFlashCartWidget> implements TabBarToolbarContribution {
    @inject(CommandService)
    private readonly commandService: CommandService;
    @inject(ViewModeService)
    private readonly viewModeService: ViewModeService;
    @inject(VesFlashCartService)
    private readonly vesFlashCartService: VesFlashCartService;

    constructor() {
        super({
            widgetId: VesFlashCartWidget.ID,
            widgetName: VesFlashCartWidget.LABEL,
            defaultWidgetOptions: {
                area: 'main',
                rank: 900,
            },
        });
    }

    async registerCommands(commandRegistry: CommandRegistry): Promise<void> {
        super.registerCommands(commandRegistry);

        commandRegistry.registerCommand(VesFlashCartCommands.WIDGET_TOGGLE, {
            isEnabled: () => this.viewModeService.getViewMode() === ViewMode.build,
            isVisible: () => this.viewModeService.getViewMode() === ViewMode.build,
            execute: () => this.toggleView()
        });

        commandRegistry.registerCommand(VesFlashCartCommands.WIDGET_HELP, {
            isEnabled: () => true,
            isVisible: widget => widget?.id === VesFlashCartWidget.ID,
            execute: () => this.commandService.executeCommand(VesCoreCommands.OPEN_DOCUMENTATION.id, 'basics/flash-carts', false),
        });

        commandRegistry.registerCommand(VesFlashCartCommands.WIDGET_SETTINGS, {
            isEnabled: () => true,
            isVisible: widget => widget?.id === VesFlashCartWidget.ID,
            execute: () => this.commandService.executeCommand(CommonCommands.OPEN_PREFERENCES.id, 'Flash Carts'),
        });

        commandRegistry.registerCommand(VesFlashCartCommands.WIDGET_REFRESH, {
            isEnabled: () => true,
            isVisible: widget => widget?.id === VesFlashCartWidget.ID,
            execute: () => this.vesFlashCartService.detectConnectedFlashCarts(),
        });
    }

    async registerToolbarItems(toolbar: TabBarToolbarRegistry): Promise<void> {
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
}
