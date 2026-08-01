import { CommandRegistry } from '@theia/core';
import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { VesFlashCartCommands } from './ves-flash-cart-commands';
import { FlashCartConfigsWidget } from './ves-flash-cart-configs-widget';
import { VesFlashCartWidget } from './ves-flash-cart-widget';

@injectable()
export class FlashCartConfigsViewContribution extends AbstractViewContribution<FlashCartConfigsWidget> {
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
        await this.openView({ activate: true, reveal: true });
    }

    async registerCommands(commandRegistry: CommandRegistry): Promise<void> {
        super.registerCommands(commandRegistry);

        commandRegistry.registerCommand(VesFlashCartCommands.CONFIG_WIDGET_TOGGLE, {
            isEnabled: () => true,
            isVisible: widget => widget?.id === VesFlashCartWidget.ID,
            execute: () => this.toggleWidget()
        });
    }
}
