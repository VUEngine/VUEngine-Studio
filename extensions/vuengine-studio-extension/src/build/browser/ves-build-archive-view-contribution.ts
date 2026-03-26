import { CommandRegistry } from '@theia/core';
import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { inject, injectable } from '@theia/core/shared/inversify';
import { ViewModeService } from '../../viewMode/browser/view-mode-service';
import { ViewMode } from '../../viewMode/browser/view-mode-types';
import { VesBuildArchiveWidget } from './ves-build-archive-widget';
import { VesBuildCommands } from './ves-build-commands';

@injectable()
export class VesBuildArchiveViewContribution extends AbstractViewContribution<VesBuildArchiveWidget> implements TabBarToolbarContribution {
    @inject(ViewModeService)
    private readonly viewModeService: ViewModeService;

    constructor() {
        super({
            widgetId: VesBuildArchiveWidget.ID,
            widgetName: VesBuildArchiveWidget.LABEL,
            defaultWidgetOptions: {
                area: 'right',
                rank: 100,
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: true, reveal: true });
    }

    protected async toggleWidget(): Promise<void> {
        await this.viewModeService.setViewMode(ViewMode.build);
        await this.openView({ activate: true, reveal: true });
    }

    protected async hideView(): Promise<void> {
        const area = this.shell.getAreaFor(await this.widget);
        if (area && this.shell.isExpanded(area)) {
            await this.toggleView();
        }
    }

    async registerCommands(commandRegistry: CommandRegistry): Promise<void> {
        super.registerCommands(commandRegistry);

        commandRegistry.registerCommand(VesBuildCommands.ARCHIVE_WIDGET_TOGGLE, {
            execute: () => this.toggleWidget()
        });

        commandRegistry.registerCommand(VesBuildCommands.ARCHIVE_CLEAR, {
            isEnabled: () => true,
            isVisible: widget => widget?.id === VesBuildArchiveWidget.ID,
            execute: widget => (widget as VesBuildArchiveWidget).clearArchive(),
        });
    }

    async registerToolbarItems(toolbar: TabBarToolbarRegistry): Promise<void> {
        toolbar.registerItem({
            id: VesBuildCommands.ARCHIVE_CLEAR.id,
            command: VesBuildCommands.ARCHIVE_CLEAR.id,
            tooltip: VesBuildCommands.ARCHIVE_CLEAR.label,
            priority: 2,
        });
    }
}
