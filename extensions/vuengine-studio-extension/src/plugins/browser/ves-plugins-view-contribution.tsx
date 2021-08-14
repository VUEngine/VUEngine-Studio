import { injectable, inject } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { CommandContribution, CommandRegistry, CommandService } from '@theia/core/lib/common/command';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { VesPluginsCommands } from './ves-plugins-commands';
import { VesPluginsViewCommands, VesPluginsViewContainer } from './ves-plugins-view-container';
import { VesPluginsModel } from './ves-plugins-model';
import { INSTALLED_QUERY, RECOMMENDED_QUERY } from './ves-plugins-search-model';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { VesDocumentationCommands } from '../../documentation/browser/ves-documentation-commands';

@injectable()
export class VesPluginsViewContribution extends AbstractViewContribution<VesPluginsViewContainer>
    implements CommandContribution, FrontendApplicationContribution, TabBarToolbarContribution {

    @inject(VesPluginsModel) protected readonly model: VesPluginsModel;
    @inject(CommandRegistry) protected readonly commandRegistry: CommandRegistry;
    @inject(CommandService) protected readonly commandService: CommandService;

    constructor() {
        super({
            widgetId: VesPluginsViewContainer.ID,
            widgetName: VesPluginsViewContainer.LABEL,
            defaultWidgetOptions: {
                area: 'left',
                rank: 200,
            },
            toggleCommandId: 'vesPlugins.toggle',
            toggleKeybinding: 'ctrlcmd+shift+l',
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: false });
    }

    registerCommands(commandRegistry: CommandRegistry): void {
        super.registerCommands(commandRegistry);

        commandRegistry.registerCommand(VesPluginsViewCommands.CLEAR_ALL, {
            isEnabled: () => !!this.model.search.query,
            isVisible: widget => widget !== undefined &&
                widget.id !== undefined &&
                widget.id === VesPluginsViewContainer.ID,
            execute: () => this.model.search.query = '',
        });

        commandRegistry.registerCommand(VesPluginsViewCommands.HELP, {
            isEnabled: () => true,
            isVisible: widget => widget !== undefined &&
                widget.id !== undefined &&
                widget.id === VesPluginsViewContainer.ID,
            execute: () => this.commandService.executeCommand(VesDocumentationCommands.OPEN_HANDBOOK.id, 'user-interface/plugins-view', false),
        });

        commandRegistry.registerCommand(VesPluginsCommands.SHOW_INSTALLED, {
            execute: () => this.showInstalledPlugins()
        });

        commandRegistry.registerCommand(VesPluginsCommands.SHOW_RECOMMENDATIONS, {
            execute: () => this.showRecommendedPlugins()
        });
    }

    protected async showInstalledPlugins(): Promise<void> {
        await this.openView({ activate: true });
        this.model.search.query = INSTALLED_QUERY;
    }

    protected async showRecommendedPlugins(): Promise<void> {
        await this.openView({ activate: true });
        this.model.search.query = RECOMMENDED_QUERY;
    }

    registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
        toolbar.registerItem({
            id: VesPluginsViewCommands.CLEAR_ALL.id,
            command: VesPluginsViewCommands.CLEAR_ALL.id,
            tooltip: VesPluginsViewCommands.CLEAR_ALL.label,
            priority: 0,
        });
        toolbar.registerItem({
            id: VesPluginsViewCommands.HELP.id,
            command: VesPluginsViewCommands.HELP.id,
            tooltip: VesPluginsViewCommands.HELP.label,
            priority: 1,
        });
    }
}
