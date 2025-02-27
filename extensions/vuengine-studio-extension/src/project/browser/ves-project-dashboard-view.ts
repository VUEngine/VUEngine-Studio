import { CommandContribution, CommandRegistry, CommandService } from '@theia/core';
import { AbstractViewContribution, CommonCommands } from '@theia/core/lib/browser';
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
                rank: -1000,
            },
        });
    }

    registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.registerCommand(VesProjectCommands.WIDGET_TOGGLE, {
            execute: async () => {
                await this.openView({
                    area: 'main',
                    activate: true,
                    reveal: true,
                    rank: -1000,
                });
                this.commandService.executeCommand(CommonCommands.PIN_TAB.id);
            }
        });
    }
}
