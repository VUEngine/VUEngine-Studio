import { injectable, inject } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { CommandContribution, CommandRegistry } from '@theia/core/lib/common/command';
import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { VesPluginsCommands } from './ves-plugins-commands';
import { VesPluginsViewCommands, VesPluginsViewContainer } from './ves-plugins-view-container';
import { VesPluginsModel } from './ves-plugins-model';
import { INSTALLED_QUERY, RECOMMENDED_QUERY } from './ves-plugins-search-model';

@injectable()
export class VesPluginsViewContribution extends AbstractViewContribution<VesPluginsViewContainer>
    implements CommandContribution, FrontendApplicationContribution {

    @inject(VesPluginsModel) protected readonly model: VesPluginsModel;
    @inject(CommandRegistry) protected readonly commandRegistry: CommandRegistry;

    // TODO: show in initial layout
    constructor() {
        super({
            widgetId: VesPluginsViewContainer.ID,
            widgetName: VesPluginsViewContainer.LABEL,
            defaultWidgetOptions: {
                area: 'left',
                rank: 200,
            },
            toggleCommandId: 'vesPlugins.toggle',
            // toggleKeybinding: 'ctrlcmd+shift+x',
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: false });
    }

    registerCommands(commands: CommandRegistry): void {
        super.registerCommands(commands);

        commands.registerCommand(VesPluginsViewCommands.CLEAR_ALL, {
            execute: () => this.model.search.query = '',
            isEnabled: () => !!this.model.search.query,
            isVisible: () => true,
        });

        commands.registerCommand(VesPluginsCommands.SHOW_INSTALLED, {
            execute: () => this.showInstalledPlugins()
        });

        commands.registerCommand(VesPluginsCommands.SHOW_RECOMMENDATIONS, {
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
}
