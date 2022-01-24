import { CommonCommands, FrontendApplicationContribution } from '@theia/core/lib/browser';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { CommandContribution, CommandRegistry, CommandService } from '@theia/core/lib/common/command';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesDocumentationCommands } from '../../documentation/browser/ves-documentation-commands';
import { VesPluginsCommands } from './ves-plugins-commands';
import { VesPluginsModel } from './ves-plugins-model';
import { AUTHOR_SEARCH_QUERY, INSTALLED_QUERY, RECOMMENDED_QUERY, TAG_SEARCH_QUERY } from './ves-plugins-search-model';
import { VesPluginsSourceOptions } from './ves-plugins-source';
import { VesPluginsViewCommands, VesPluginsViewContainer } from './ves-plugins-view-container';
import { VesPluginsWidget } from './ves-plugins-widget';

@injectable()
export class VesPluginsViewContribution extends AbstractViewContribution<VesPluginsViewContainer>
    implements CommandContribution, FrontendApplicationContribution, TabBarToolbarContribution {

    @inject(VesPluginsModel)
    protected readonly model: VesPluginsModel;
    @inject(CommandRegistry)
    protected readonly commandRegistry: CommandRegistry;
    @inject(CommandService)
    protected readonly commandService: CommandService;

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
                [
                    `${VesPluginsWidget.ID}:${VesPluginsSourceOptions.SEARCH_RESULT}`,
                    VesPluginsViewContainer.ID
                ].includes(widget.id),
            execute: () => this.model.search.query = '',
        });

        commandRegistry.registerCommand(VesPluginsViewCommands.HELP, {
            isEnabled: () => true,
            isVisible: widget => widget !== undefined &&
                [
                    `${VesPluginsWidget.ID}:${VesPluginsSourceOptions.SEARCH_RESULT}`,
                    VesPluginsViewContainer.ID
                ].includes(widget.id),
            execute: () => this.commandService.executeCommand(VesDocumentationCommands.OPEN_HANDBOOK.id, 'user-interface/plugins-view', false),
        });

        commandRegistry.registerCommand(VesPluginsCommands.SHOW_INSTALLED, {
            execute: () => this.showInstalledPlugins()
        });

        commandRegistry.registerCommand(VesPluginsCommands.SHOW_RECOMMENDATIONS, {
            execute: () => this.showRecommendedPlugins()
        });

        commandRegistry.registerCommand(VesPluginsCommands.SEARCH_BY_TAG, {
            execute: (tag?: string) => this.showSearchByTag(tag)
        });

        commandRegistry.registerCommand(VesPluginsCommands.SEARCH_BY_AUTHOR, {
            execute: (author?: string) => this.showSearchByAuthor(author)
        });

        commandRegistry.registerCommand(VesPluginsViewCommands.SETTINGS, {
            isEnabled: () => true,
            isVisible: widget => widget !== undefined &&
                [
                    `${VesPluginsWidget.ID}:${VesPluginsSourceOptions.SEARCH_RESULT}`,
                    VesPluginsViewContainer.ID
                ].includes(widget.id),
            execute: () => this.commandService.executeCommand(CommonCommands.OPEN_PREFERENCES.id, 'plugins'),
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

    protected async showSearchByTag(tag?: string): Promise<void> {
        await this.openView({ activate: true });
        this.model.search.query = `${TAG_SEARCH_QUERY}${tag ?? ''}`;
    }

    protected async showSearchByAuthor(author?: string): Promise<void> {
        await this.openView({ activate: true });
        this.model.search.query = `${AUTHOR_SEARCH_QUERY}${author ?? ''}`;
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
        toolbar.registerItem({
            id: VesPluginsViewCommands.SETTINGS.id,
            command: VesPluginsViewCommands.SETTINGS.id,
            tooltip: VesPluginsViewCommands.SETTINGS.label,
            priority: 2,
        });
    }
}
