import { MenuModelRegistry } from '@theia/core';
import { CommonCommands, CommonMenus, FrontendApplicationContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { CommandRegistry, CommandService } from '@theia/core/lib/common/command';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesCoreCommands } from '../../core/browser/ves-core-commands';
import { VesPluginsCommands } from './ves-plugins-commands';
import { VesPluginsModel } from './ves-plugins-model';
import { AUTHOR_SEARCH_QUERY, INSTALLED_QUERY, RECOMMENDED_QUERY, TAG_SEARCH_QUERY, TAGS_QUERY } from './ves-plugins-search-model';
import { VesPluginsSourceOptions } from './ves-plugins-source';
import { VesPluginsViewContainer } from './ves-plugins-view-container';
import { VesPluginsWidget } from './ves-plugins-widget';

@injectable()
export class VesPluginsViewContribution extends AbstractViewContribution<VesPluginsViewContainer>
    implements FrontendApplicationContribution, TabBarToolbarContribution {

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
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: false, reveal: false });
    }

    async registerCommands(commandRegistry: CommandRegistry): Promise<void> {
        super.registerCommands(commandRegistry);

        commandRegistry.registerCommand(VesPluginsCommands.WIDGET_TOGGLE, {
            execute: () => this.toggleView()
        });

        commandRegistry.registerCommand(VesPluginsCommands.WIDGET_CLEAR_ALL, {
            isEnabled: () => !!this.model.search.query,
            isVisible: widget => widget !== undefined &&
                [
                    `${VesPluginsWidget.ID}:${VesPluginsSourceOptions.SEARCH_RESULT}`,
                    VesPluginsViewContainer.ID
                ].includes(widget.id),
            execute: () => this.model.search.query = '',
        });

        commandRegistry.registerCommand(VesPluginsCommands.WIDGET_HELP, {
            isEnabled: () => true,
            isVisible: widget => widget !== undefined &&
                [
                    `${VesPluginsWidget.ID}:${VesPluginsSourceOptions.SEARCH_RESULT}`,
                    VesPluginsViewContainer.ID
                ].includes(widget.id),
            execute: () => this.commandService.executeCommand(VesCoreCommands.OPEN_DOCUMENTATION.id, 'user-guide/vuengine-plugins', false),
        });

        commandRegistry.registerCommand(VesPluginsCommands.SHOW_TAGS, {
            execute: () => this.showPluginTags()
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

        commandRegistry.registerCommand(VesPluginsCommands.WIDGET_SETTINGS, {
            isEnabled: () => true,
            isVisible: widget => widget !== undefined &&
                [
                    `${VesPluginsWidget.ID}:${VesPluginsSourceOptions.SEARCH_RESULT}`,
                    VesPluginsViewContainer.ID
                ].includes(widget.id),
            execute: () => this.commandService.executeCommand(CommonCommands.OPEN_PREFERENCES.id, 'plugins'),
        });
    }

    protected async showPluginTags(): Promise<void> {
        await this.openView({ activate: true });
        this.model.search.query = TAGS_QUERY;
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

    async registerToolbarItems(toolbar: TabBarToolbarRegistry): Promise<void> {
        toolbar.registerItem({
            id: VesPluginsCommands.WIDGET_CLEAR_ALL.id,
            command: VesPluginsCommands.WIDGET_CLEAR_ALL.id,
            tooltip: VesPluginsCommands.WIDGET_CLEAR_ALL.label,
            priority: 0,
        });
        toolbar.registerItem({
            id: VesPluginsCommands.WIDGET_HELP.id,
            command: VesPluginsCommands.WIDGET_HELP.id,
            tooltip: VesPluginsCommands.WIDGET_HELP.label,
            priority: 1,
        });
        toolbar.registerItem({
            id: VesPluginsCommands.WIDGET_SETTINGS.id,
            command: VesPluginsCommands.WIDGET_SETTINGS.id,
            tooltip: VesPluginsCommands.WIDGET_SETTINGS.label,
            priority: 2,
        });
    }

    async registerMenus(menus: MenuModelRegistry): Promise<void> {
        super.registerMenus(menus);

        menus.registerMenuAction(CommonMenus.VIEW_VIEWS, {
            commandId: VesPluginsCommands.WIDGET_TOGGLE.id,
            label: this.viewLabel
        });
    }

    async registerKeybindings(keybindings: KeybindingRegistry): Promise<void> {
        super.registerKeybindings(keybindings);

        keybindings.registerKeybinding({
            command: VesPluginsCommands.WIDGET_TOGGLE.id,
            keybinding: 'ctrlcmd+shift+l'
        });
    }
}
