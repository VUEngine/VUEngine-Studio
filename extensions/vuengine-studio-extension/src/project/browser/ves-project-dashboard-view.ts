import { CommandContribution, CommandRegistry, CommandService } from '@theia/core';
import { AbstractViewContribution } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesProjectCommands } from './ves-project-commands';
import { VesProjectDashboardWidget } from './ves-project-dashboard-widget';

@injectable()
export class VesProjectDashboardViewContribution extends AbstractViewContribution<VesProjectDashboardWidget> implements CommandContribution {
    @inject(CommandService)
    protected readonly commandService: CommandService;

    constructor() {
        super({
            widgetId: VesProjectDashboardWidget.ID,
            widgetName: VesProjectDashboardWidget.LABEL,
            defaultWidgetOptions: {
                area: 'main',
                // rank: -1000,
            },
        });
    }

    registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.registerCommand(VesProjectCommands.DASHBOARD_TOGGLE, {
            execute: async () => {
                await this.openView({
                    area: 'main',
                    activate: true,
                    reveal: true,
                    // rank: -1000,
                });
                // this.commandService.executeCommand(CommonCommands.PIN_TAB.id);
            }
        });

        commandRegistry.registerCommand(VesProjectCommands.ZOOM_IN, {
            isEnabled: () => this.shell.currentWidget instanceof VesProjectDashboardWidget,
            isVisible: () => this.shell.currentWidget instanceof VesProjectDashboardWidget,
            execute: () => this.shell.currentWidget instanceof VesProjectDashboardWidget && this.shell.currentWidget.handleZoomIn(),
        });

        commandRegistry.registerCommand(VesProjectCommands.ZOOM_OUT, {
            isEnabled: () => this.shell.currentWidget instanceof VesProjectDashboardWidget,
            isVisible: () => this.shell.currentWidget instanceof VesProjectDashboardWidget,
            execute: () => this.shell.currentWidget instanceof VesProjectDashboardWidget && this.shell.currentWidget.handleZoomOut(),
        });

        commandRegistry.registerCommand(VesProjectCommands.ZOOM_RESET, {
            isEnabled: () => this.shell.currentWidget instanceof VesProjectDashboardWidget,
            isVisible: () => this.shell.currentWidget instanceof VesProjectDashboardWidget,
            execute: () => this.shell.currentWidget instanceof VesProjectDashboardWidget && this.shell.currentWidget.handleZoomReset(),
        });
    }
}
