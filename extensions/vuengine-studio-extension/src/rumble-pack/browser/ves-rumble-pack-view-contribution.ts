import { CommandRegistry, CommandService } from '@theia/core';
import { AbstractViewContribution, CommonCommands } from '@theia/core/lib/browser';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesDocumentationCommands } from '../../documentation/browser/ves-documentation-commands';
import { VesRumblePackCommands } from './ves-rumble-pack-commands';
import { VesRumblePackService } from './ves-rumble-pack-service';
import { VesRumblePackWidget } from './ves-rumble-pack-widget';

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

    registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.registerCommand(VesRumblePackCommands.WIDGET_OPEN, {
            execute: () => {
                this.openView({ activate: true, reveal: true });
            }
        });

        commandRegistry.registerCommand(VesRumblePackCommands.WIDGET_EXPAND, {
            isEnabled: () => true,
            isVisible: widget => widget !== undefined &&
                widget.id === VesRumblePackWidget.ID,
            execute: async widget => widget !== undefined &&
                widget.id === VesRumblePackWidget.ID &&
                await this.openView({ activate: true, reveal: true }) &&
                this.commandService.executeCommand(CommonCommands.TOGGLE_MAXIMIZED.id)
        });

        commandRegistry.registerCommand(VesRumblePackCommands.WIDGET_HELP, {
            isEnabled: () => true,
            isVisible: widget => widget !== undefined &&
                widget.id !== undefined &&
                widget.id === VesRumblePackWidget.ID,
            execute: () => this.commandService.executeCommand(VesDocumentationCommands.OPEN_HANDBOOK.id, 'user-guide/rumble-pack', false),
        });

        commandRegistry.registerCommand(VesRumblePackCommands.WIDGET_REFRESH, {
            isEnabled: () => true,
            isVisible: widget => widget !== undefined &&
                widget.id !== undefined &&
                widget.id === VesRumblePackWidget.ID,
            execute: () => this.vesRumblePackService.detectRumblePackIsConnected(),
        });
    }

    registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
        toolbar.registerItem({
            id: VesRumblePackCommands.WIDGET_EXPAND.id,
            command: VesRumblePackCommands.WIDGET_EXPAND.id,
            tooltip: VesRumblePackCommands.WIDGET_EXPAND.label,
            priority: 1,
        });
        toolbar.registerItem({
            id: VesRumblePackCommands.WIDGET_HELP.id,
            command: VesRumblePackCommands.WIDGET_HELP.id,
            tooltip: VesRumblePackCommands.WIDGET_HELP.label,
            priority: 2,
        });
        toolbar.registerItem({
            id: VesRumblePackCommands.WIDGET_REFRESH.id,
            command: VesRumblePackCommands.WIDGET_REFRESH.id,
            tooltip: VesRumblePackCommands.WIDGET_REFRESH.label,
            priority: 3,
        });
    }
}
