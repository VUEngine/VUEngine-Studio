import { inject, injectable } from '@theia/core/shared/inversify';
import { Command, CommandRegistry, CommandService } from '@theia/core';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { VesBuildWidget } from './ves-build-widget';
import { VesDocumentationCommands } from '../../documentation/browser/ves-documentation-commands';

export namespace VesBuildViewContributionCommands {
    export const HELP: Command = {
        id: `${VesBuildWidget.ID}.help`,
        label: 'Open Handbook Page',
        iconClass: 'fa fa-book',
    };
}

@injectable()
export class VesBuildViewContribution extends AbstractViewContribution<VesBuildWidget> implements TabBarToolbarContribution {
    @inject(CommandService)
    private readonly commandService: CommandService;

    constructor() {
        super({
            widgetId: VesBuildWidget.ID,
            widgetName: VesBuildWidget.LABEL,
            defaultWidgetOptions: {
                area: 'right',
                rank: 700,
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView();
    }

    registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.registerCommand(VesBuildViewContributionCommands.HELP, {
            isEnabled: widget => widget !== undefined &&
                widget.id !== undefined &&
                widget.id === VesBuildWidget.ID,
            isVisible: widget => widget !== undefined &&
                widget.id !== undefined &&
                widget.id === VesBuildWidget.ID,
            // TODO: link correct handbook page
            execute: () => this.commandService.executeCommand(VesDocumentationCommands.OPEN_HANDBOOK.id, 'engine/post-processing', false),
        });
    }

    registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
        toolbar.registerItem({
            id: VesBuildViewContributionCommands.HELP.id,
            command: VesBuildViewContributionCommands.HELP.id,
            tooltip: VesBuildViewContributionCommands.HELP.label,
            priority: 0,
        });
    }
}
