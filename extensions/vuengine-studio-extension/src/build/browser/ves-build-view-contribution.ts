import { CommandRegistry, CommandService } from '@theia/core';
import { AbstractViewContribution, CommonCommands, KeybindingRegistry } from '@theia/core/lib/browser';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesCoreCommands } from '../../core/browser/ves-core-commands';
import { ViewModeService } from '../../viewMode/browser/view-mode-service';
import { ViewMode } from '../../viewMode/browser/view-mode-types';
import { VesBuildCommands } from './ves-build-commands';
import { VesBuildWidget } from './ves-build-widget';

@injectable()
export class VesBuildViewContribution extends AbstractViewContribution<VesBuildWidget> implements TabBarToolbarContribution {
    @inject(CommandService)
    private readonly commandService: CommandService;
    @inject(ViewModeService)
    private readonly viewModeService: ViewModeService;

    constructor() {
        super({
            widgetId: VesBuildWidget.ID,
            widgetName: VesBuildWidget.LABEL,
            defaultWidgetOptions: {
                area: 'main',
                rank: 700,
            },
        });
    }

    protected async toggleWidget(force?: boolean): Promise<void> {
        await this.viewModeService.setViewMode(ViewMode.build);
        await this.openView({ activate: true, reveal: true });

        /*
        if (force === true) {
            this.openView({ activate: true, reveal: true });
        } else if (force === false) {
            this.hideView();
        } else {
            this.toggleView();
        }
        */
    }

    protected async hideView(): Promise<void> {
        const area = this.shell.getAreaFor(await this.widget);
        if (area && this.shell.isExpanded(area)) {
            await this.toggleView();
        }
    }

    async registerCommands(commandRegistry: CommandRegistry): Promise<void> {
        super.registerCommands(commandRegistry);

        commandRegistry.registerCommand(VesBuildCommands.WIDGET_TOGGLE, {
            isEnabled: () => this.viewModeService.getViewMode() === ViewMode.build,
            isVisible: () => this.viewModeService.getViewMode() === ViewMode.build,
            execute: force => this.toggleWidget(force)
        });

        commandRegistry.registerCommand(VesBuildCommands.WIDGET_HELP, {
            isEnabled: () => true,
            isVisible: widget => widget?.id === VesBuildWidget.ID,
            execute: () => this.commandService.executeCommand(VesCoreCommands.OPEN_DOCUMENTATION.id, 'basics/building', false),
        });
        commandRegistry.registerCommand(VesBuildCommands.WIDGET_SETTINGS, {
            isEnabled: () => true,
            isVisible: widget => widget?.id === VesBuildWidget.ID,
            execute: () => this.commandService.executeCommand(CommonCommands.OPEN_PREFERENCES.id, 'Build'),
        });
    }

    async registerToolbarItems(toolbar: TabBarToolbarRegistry): Promise<void> {
        toolbar.registerItem({
            id: VesBuildCommands.WIDGET_SETTINGS.id,
            command: VesBuildCommands.WIDGET_SETTINGS.id,
            tooltip: VesBuildCommands.WIDGET_SETTINGS.label,
            priority: 2,
        });
        toolbar.registerItem({
            id: VesBuildCommands.WIDGET_HELP.id,
            command: VesBuildCommands.WIDGET_HELP.id,
            tooltip: VesBuildCommands.WIDGET_HELP.label,
            priority: 3,
        });
    }

    async registerKeybindings(keybindings: KeybindingRegistry): Promise<void> {
        super.registerKeybindings(keybindings);

        keybindings.registerKeybinding({
            command: VesBuildCommands.WIDGET_TOGGLE.id,
            keybinding: 'ctrlcmd+shift+b'
        });
    }
}
