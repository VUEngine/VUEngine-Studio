import { CommandRegistry } from '@theia/core';
import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { ViewModeService } from '../../viewMode/browser/view-mode-service';
import { ViewMode } from '../../viewMode/browser/view-mode-types';
import { VesFlashCartCommands } from './ves-flash-cart-commands';
import { FlashCartConfigsWidget } from './ves-flash-cart-configs-widget';
import { VesFlashCartWidget } from './ves-flash-cart-widget';

@injectable()
export class FlashCartConfigsViewContribution extends AbstractViewContribution<FlashCartConfigsWidget> {
    @inject(ViewModeService)
    private readonly viewModeService: ViewModeService;

    constructor() {
        super({
            widgetId: FlashCartConfigsWidget.ID,
            widgetName: FlashCartConfigsWidget.LABEL,
            defaultWidgetOptions: {
                area: 'main',
                rank: 200,
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        // await this.openView({ activate: false, reveal: false });
    }

    protected async toggleWidget(): Promise<void> {
        await this.viewModeService.setViewMode(ViewMode.sourceCode);
        await this.openView({ activate: true, reveal: true });
    }

    async registerCommands(commandRegistry: CommandRegistry): Promise<void> {
        super.registerCommands(commandRegistry);

        commandRegistry.registerCommand(VesFlashCartCommands.CONFIG_WIDGET_TOGGLE, {
            // isEnabled: () => this.viewModeService.getViewMode() === ViewMode.sourceCode,
            isEnabled: () => true,
            // isVisible: () => this.viewModeService.getViewMode() === ViewMode.sourceCode,
            isVisible: widget => widget?.id === VesFlashCartWidget.ID,
            execute: () => this.toggleWidget()
        });
    }
}
