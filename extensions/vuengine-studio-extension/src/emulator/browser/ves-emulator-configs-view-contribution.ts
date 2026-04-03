import { CommandRegistry } from '@theia/core';
import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { ViewModeService } from '../../viewMode/browser/view-mode-service';
import { ViewMode } from '../../viewMode/browser/view-mode-types';
import { EmulatorConfigsWidget } from './ves-emulator-configs-widget';

@injectable()
export class EmulatorConfigsViewContribution extends AbstractViewContribution<EmulatorConfigsWidget> {
    @inject(ViewModeService)
    private readonly viewModeService: ViewModeService;

    constructor() {
        super({
            widgetId: EmulatorConfigsWidget.ID,
            widgetName: EmulatorConfigsWidget.LABEL,
            defaultWidgetOptions: {
                area: 'left',
                rank: 100,
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: false, reveal: false });
    }

    protected async toggleWidget(): Promise<void> {
        await this.viewModeService.setViewMode(ViewMode.build);
        await this.openView({ activate: true, reveal: true });
    }

    async registerCommands(commandRegistry: CommandRegistry): Promise<void> {
        super.registerCommands(commandRegistry);

        /*
        commandRegistry.registerCommand(VesBuildCommands.ARCHIVE_WIDGET_TOGGLE, {
            isEnabled: () => this.viewModeService.getViewMode() === ViewMode.build,
            isVisible: () => this.viewModeService.getViewMode() === ViewMode.build,
            execute: () => this.toggleWidget()
        });
        */
    }
}
