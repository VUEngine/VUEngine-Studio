import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { AbstractViewContribution } from '@theia/core/lib/browser';
import { VesTitlebarWindowControlsWidget } from './ves-titlebar-window-controls-widget';
import { CommandRegistry } from '@theia/core';
import { getCurrentWindow } from '@theia/core/electron-shared/@electron/remote';
import { VesTitlebarWindowControlCommands } from './ves-titlebar-window-controls-commands';

@injectable()
export class VesTitlebarWindowControlsContribution extends AbstractViewContribution<VesTitlebarWindowControlsWidget> {

    constructor() {
        super({
            widgetId: VesTitlebarWindowControlsWidget.ID,
            widgetName: VesTitlebarWindowControlsWidget.LABEL,
            defaultWidgetOptions: { area: 'top' }
        });
    }

    @postConstruct()
    protected async init(): Promise<void> {
        await this.openView({ activate: true, reveal: true });
    }

    registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.registerCommand(VesTitlebarWindowControlCommands.MINIMIZE, {
            execute: () => getCurrentWindow().minimize()
        });
        commandRegistry.registerCommand(VesTitlebarWindowControlCommands.MAXIMIZE, {
            execute: () => getCurrentWindow().maximize()
        });
        commandRegistry.registerCommand(VesTitlebarWindowControlCommands.UNMAXIMIZE, {
            execute: () => getCurrentWindow().unmaximize()
        });
    }
}
