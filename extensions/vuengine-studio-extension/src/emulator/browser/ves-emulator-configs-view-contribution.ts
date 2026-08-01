import { CommandRegistry } from '@theia/core';
import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { EmulatorCommands } from './ves-emulator-commands';
import { EmulatorConfigsWidget } from './ves-emulator-configs-widget';
import { VesEmulatorSidebarWidget } from './ves-emulator-sidebar-widget';

@injectable()
export class EmulatorConfigsViewContribution extends AbstractViewContribution<EmulatorConfigsWidget> {
    constructor() {
        super({
            widgetId: EmulatorConfigsWidget.ID,
            widgetName: EmulatorConfigsWidget.LABEL,
            defaultWidgetOptions: {
                area: 'main',
                rank: 100,
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

        commandRegistry.registerCommand(EmulatorCommands.CONFIG_WIDGET_TOGGLE, {
            isEnabled: () => true,
            isVisible: widget => widget?.id === VesEmulatorSidebarWidget.ID,
            execute: () => this.toggleWidget()
        });
    }
}
