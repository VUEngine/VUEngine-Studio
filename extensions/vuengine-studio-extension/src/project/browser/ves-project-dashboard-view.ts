import { CommandContribution, CommandRegistry, CommandService } from '@theia/core';
import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesWorkspaceService } from '../../core/browser/ves-workspace-service';
import { VesProjectCommands } from './ves-project-commands';
import { VesProjectDashboardWidget } from './ves-project-dashboard-widget';

@injectable()
export class VesProjectDashboardViewContribution extends AbstractViewContribution<VesProjectDashboardWidget> implements CommandContribution {
    @inject(CommandService)
    protected readonly commandService: CommandService;
    @inject(VesWorkspaceService)
    protected readonly workspaceService: VesWorkspaceService;

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

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: true, reveal: true });
    }

    registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.registerCommand(VesProjectCommands.ZOOM_IN, {
            isEnabled: widget => widget?.id === VesProjectDashboardWidget.ID,
            isVisible: widget => widget?.id === VesProjectDashboardWidget.ID,
            execute: widget => (widget as VesProjectDashboardWidget).handleZoomIn(),
        });

        commandRegistry.registerCommand(VesProjectCommands.ZOOM_OUT, {
            isEnabled: widget => widget?.id === VesProjectDashboardWidget.ID,
            isVisible: widget => widget?.id === VesProjectDashboardWidget.ID,
            execute: widget => (widget as VesProjectDashboardWidget).handleZoomOut(),
        });

        commandRegistry.registerCommand(VesProjectCommands.ZOOM_RESET, {
            isEnabled: widget => widget?.id === VesProjectDashboardWidget.ID,
            isVisible: widget => widget?.id === VesProjectDashboardWidget.ID,
            execute: widget => (widget as VesProjectDashboardWidget).handleZoomReset(),
        });
    }
}
