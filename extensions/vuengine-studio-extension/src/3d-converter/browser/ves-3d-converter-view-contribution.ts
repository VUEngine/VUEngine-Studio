import { CommandRegistry, CommandService } from '@theia/core';
import { AbstractViewContribution, CommonCommands } from '@theia/core/lib/browser';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesDocumentationCommands } from '../../documentation/browser/ves-documentation-commands';
import { Ves3dConverterCommands } from './ves-3d-converter-commands';
import { Ves3dConverterWidget } from './ves-3d-converter-widget';

@injectable()
export class Ves3dConverterViewContribution extends AbstractViewContribution<Ves3dConverterWidget> implements TabBarToolbarContribution {
    @inject(CommandService)
    private readonly commandService: CommandService;

    constructor() {
        super({
            widgetId: Ves3dConverterWidget.ID,
            widgetName: Ves3dConverterWidget.LABEL,
            defaultWidgetOptions: {
                area: 'main',
            },
        });
    }

    registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.registerCommand(Ves3dConverterCommands.WIDGET_OPEN, {
            execute: () => {
                this.openView({ activate: true, reveal: true });
            }
        });

        commandRegistry.registerCommand(Ves3dConverterCommands.WIDGET_EXPAND, {
            isEnabled: () => true,
            isVisible: widget => widget !== undefined &&
                widget.id === Ves3dConverterWidget.ID,
            execute: async widget => widget !== undefined &&
                widget.id === Ves3dConverterWidget.ID &&
                await this.openView({ activate: true, reveal: true }) &&
                this.commandService.executeCommand(CommonCommands.TOGGLE_MAXIMIZED.id)
        });

        commandRegistry.registerCommand(Ves3dConverterCommands.WIDGET_HELP, {
            isEnabled: () => true,
            isVisible: widget => widget !== undefined &&
                widget.id !== undefined &&
                widget.id === Ves3dConverterWidget.ID,
            execute: () => this.commandService.executeCommand(VesDocumentationCommands.OPEN_HANDBOOK.id, 'user-guide/3d-converter', false),
        });
    }

    registerToolbarItems(toolbar: TabBarToolbarRegistry): void {
        toolbar.registerItem({
            id: Ves3dConverterCommands.WIDGET_EXPAND.id,
            command: Ves3dConverterCommands.WIDGET_EXPAND.id,
            tooltip: Ves3dConverterCommands.WIDGET_EXPAND.label,
            priority: 1,
        });
        toolbar.registerItem({
            id: Ves3dConverterCommands.WIDGET_HELP.id,
            command: Ves3dConverterCommands.WIDGET_HELP.id,
            tooltip: Ves3dConverterCommands.WIDGET_HELP.label,
            priority: 2,
        });
    }
}
