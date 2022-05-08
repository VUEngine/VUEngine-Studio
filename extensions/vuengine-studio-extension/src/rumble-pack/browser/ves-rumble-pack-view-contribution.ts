import { inject, injectable } from '@theia/core/shared/inversify';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { AbstractViewContribution, CommonCommands, FrontendApplication } from '@theia/core/lib/browser';
import { VesRumblePackWidget } from './ves-rumble-pack-widget';
import { VesRumblePackCommands } from './ves-rumble-pack-commands';
import { Command, CommandRegistry, CommandService } from '@theia/core';
import { VesRumblePackService } from './ves-rumble-pack-service';
import { VesDocumentationCommands } from '../../documentation/browser/ves-documentation-commands';

export namespace VesRumblePackViewContributionCommands {
    export const EXPAND: Command = {
        id: `${VesRumblePackWidget.ID}.expand`,
        label: 'Toggle Maximized',
        iconClass: 'codicon codicon-arrow-both',
    };
    export const HELP: Command = {
        id: `${VesRumblePackWidget.ID}.help`,
        label: 'Show Handbook Page',
        iconClass: 'codicon codicon-book',
    };
    export const REFRESH: Command = {
        id: `${VesRumblePackWidget.ID}.refresh`,
        label: VesRumblePackCommands.DETECT.label,
        iconClass: 'codicon codicon-refresh',
    };
}

@injectable()
export class VesRumblePackViewContribution extends AbstractViewContribution<VesRumblePackWidget> implements TabBarToolbarContribution {
    @inject(CommandService)
    private readonly commandService: CommandService;
    @inject(VesRumblePackService)
    private readonly vesRumblePackService: VesRumblePackService;

    constructor() {
        super({
            widgetId: VesRumblePackWidget.ID,
            widgetName: VesRumblePackWidget.LABEL,
            defaultWidgetOptions: {
                area: 'main',
            },
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView({ activate: false, reveal: false });
    }

    registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.registerCommand(VesRumblePackViewContributionCommands.EXPAND, {
            isEnabled: () => true,
            isVisible: widget => widget !== undefined &&
                widget.id === VesRumblePackWidget.ID,
            execute: async widget => widget !== undefined &&
                widget.id === VesRumblePackWidget.ID &&
                await this.openView({ activate: true, reveal: true }) &&
                this.commandService.executeCommand(CommonCommands.TOGGLE_MAXIMIZED.id)
        });
        commandRegistry.registerCommand(VesRumblePackViewContributionCommands.HELP, {
            isEnabled: () => true,
            isVisible: widget => widget !== undefined &&
                widget.id !== undefined &&
                widget.id === VesRumblePackWidget.ID,
            execute: () => this.commandService.executeCommand(VesDocumentationCommands.OPEN_HANDBOOK.id, 'user-guide/rumble-pack', false),
        });
        commandRegistry.registerCommand(VesRumblePackViewContributionCommands.REFRESH, {
            isEnabled: () => true,
            isVisible: widget => widget !== undefined &&
                widget.id !== undefined &&
                widget.id === VesRumblePackWidget.ID,
            execute: () => this.vesRumblePackService.detectRumblePackIsConnected(),
        });
    }

    registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
        toolbar.registerItem({
            id: VesRumblePackViewContributionCommands.EXPAND.id,
            command: VesRumblePackViewContributionCommands.EXPAND.id,
            tooltip: VesRumblePackViewContributionCommands.EXPAND.label,
            priority: 1,
        });
        toolbar.registerItem({
            id: VesRumblePackViewContributionCommands.HELP.id,
            command: VesRumblePackViewContributionCommands.HELP.id,
            tooltip: VesRumblePackViewContributionCommands.HELP.label,
            priority: 2,
        });
        toolbar.registerItem({
            id: VesRumblePackViewContributionCommands.REFRESH.id,
            command: VesRumblePackViewContributionCommands.REFRESH.id,
            tooltip: VesRumblePackViewContributionCommands.REFRESH.label,
            priority: 3,
        });
    }
}
