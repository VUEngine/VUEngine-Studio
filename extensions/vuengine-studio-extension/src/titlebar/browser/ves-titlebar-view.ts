import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { AbstractViewContribution } from '@theia/core/lib/browser';
import { TitlebarWidget } from './ves-titlebar-widget';
import { CommandRegistry } from '@theia/core';
import { TitlebarCommands } from './ves-titlebar-commands';

@injectable()
export class TitlebarContribution extends AbstractViewContribution<TitlebarWidget> {

    constructor() {
        super({
            widgetId: TitlebarWidget.ID,
            widgetName: TitlebarWidget.LABEL,
            defaultWidgetOptions: { area: 'top' }
        });
    }

    @postConstruct()
    protected init(): void {
        this.openView({ activate: true, reveal: false });
    }

    registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.registerCommand(TitlebarCommands.MINIMIZE, {
            execute: () => window.electronTheiaCore.minimize()
        });
        commandRegistry.registerCommand(TitlebarCommands.MAXIMIZE, {
            execute: () => window.electronTheiaCore.maximize()
        });
        commandRegistry.registerCommand(TitlebarCommands.UNMAXIMIZE, {
            execute: () => window.electronTheiaCore.unMaximize()
        });
    }
}
