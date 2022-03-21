import { inject, injectable } from '@theia/core/shared/inversify';
import { Command, CommandRegistry, CommandService } from '@theia/core';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { ApplicationShell, AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { VesImageConverterWidget } from './ves-image-converter-widget';
import { VesDocumentationCommands } from '../../documentation/browser/ves-documentation-commands';

export namespace VesImageConverterViewContributionCommands {
    export const HELP: Command = {
        id: `${VesImageConverterWidget.ID}.help`,
        label: 'Show Handbook Page',
        iconClass: 'codicon codicon-book',
    };
}

@injectable()
export class VesImageConverterViewContribution extends AbstractViewContribution<VesImageConverterWidget> implements TabBarToolbarContribution {
    @inject(ApplicationShell)
    protected readonly applicationShell: ApplicationShell;
    @inject(CommandService)
    private readonly commandService: CommandService;

    constructor() {
        super({
            widgetId: VesImageConverterWidget.ID,
            widgetName: VesImageConverterWidget.LABEL,
            defaultWidgetOptions: {
                area: 'right',
                rank: 900,
            },
            // TODO
            // toggleCommandId: `${VesImageConverterWidget.ID}.toggle`,
            // toggleKeybinding: 'ctrlcmd+shift+i',
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: false, reveal: false });
    }

    registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.registerCommand(VesImageConverterViewContributionCommands.HELP, {
            isEnabled: () => true,
            isVisible: widget => widget !== undefined &&
                widget.id === VesImageConverterWidget.ID,
            execute: () => this.commandService.executeCommand(VesDocumentationCommands.OPEN_HANDBOOK.id, 'user-guide/assets', false),
        });
    }

    registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
        toolbar.registerItem({
            id: VesImageConverterViewContributionCommands.HELP.id,
            command: VesImageConverterViewContributionCommands.HELP.id,
            tooltip: VesImageConverterViewContributionCommands.HELP.label,
            priority: 3,
        });
    }
}
