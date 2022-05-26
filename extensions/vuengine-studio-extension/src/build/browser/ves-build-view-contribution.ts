import { inject, injectable } from '@theia/core/shared/inversify';
import { CommandRegistry, CommandService, MenuModelRegistry } from '@theia/core';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { AbstractViewContribution, CommonCommands, CommonMenus, FrontendApplication, KeybindingRegistry } from '@theia/core/lib/browser';
import { VesBuildWidget } from './ves-build-widget';
import { VesDocumentationCommands } from '../../documentation/browser/ves-documentation-commands';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesBuildCommands } from './ves-build-commands';

@injectable()
export class VesBuildViewContribution extends AbstractViewContribution<VesBuildWidget> implements TabBarToolbarContribution {
    @inject(CommandService)
    private readonly commandService: CommandService;
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

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
        await this.workspaceService.ready;
        if (this.workspaceService.opened) {
            await this.openView({ activate: false, reveal: false });
        }
    }

    async registerCommands(commandRegistry: CommandRegistry): Promise<void> {
        super.registerCommands(commandRegistry);

        await this.workspaceService.ready;
        if (this.workspaceService.opened) {
            commandRegistry.registerCommand(VesBuildCommands.WIDGET_TOGGLE, {
                execute: () => this.toggleView()
            });

            commandRegistry.registerCommand(VesBuildCommands.WIDGET_EXPAND, {
                isEnabled: () => true,
                isVisible: widget => widget !== undefined &&
                    widget.id === VesBuildWidget.ID,
                execute: async widget => widget !== undefined &&
                    widget.id === VesBuildWidget.ID &&
                    await this.openView({ activate: true, reveal: true }) &&
                    this.commandService.executeCommand(CommonCommands.TOGGLE_MAXIMIZED.id)
            });
            commandRegistry.registerCommand(VesBuildCommands.WIDGET_HELP, {
                isEnabled: () => true,
                isVisible: widget => widget !== undefined &&
                    widget.id === VesBuildWidget.ID,
                execute: () => this.commandService.executeCommand(VesDocumentationCommands.OPEN_HANDBOOK.id, 'user-guide/building', false),
            });
            commandRegistry.registerCommand(VesBuildCommands.WIDGET_SETTINGS, {
                isEnabled: () => true,
                isVisible: widget => widget !== undefined &&
                    widget.id === VesBuildWidget.ID,
                execute: () => this.commandService.executeCommand(CommonCommands.OPEN_PREFERENCES.id, 'build'),
            });
        }
    }

    async registerToolbarItems(toolbar: TabBarToolbarRegistry): Promise<void> {
        await this.workspaceService.ready;
        if (this.workspaceService.opened) {
            toolbar.registerItem({
                id: VesBuildCommands.WIDGET_EXPAND.id,
                command: VesBuildCommands.WIDGET_EXPAND.id,
                tooltip: VesBuildCommands.WIDGET_EXPAND.label,
                priority: 0,
            });
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
    }

    async registerMenus(menus: MenuModelRegistry): Promise<void> {
        super.registerMenus(menus);

        await this.workspaceService.ready;
        if (this.workspaceService.opened) {
            menus.registerMenuAction(CommonMenus.VIEW_VIEWS, {
                commandId: VesBuildCommands.WIDGET_TOGGLE.id,
                label: this.viewLabel
            });
        }
    }

    async registerKeybindings(keybindings: KeybindingRegistry): Promise<void> {
        super.registerKeybindings(keybindings);

        await this.workspaceService.ready;
        if (this.workspaceService.opened) {
            keybindings.registerKeybinding({
                command: VesBuildCommands.WIDGET_TOGGLE.id,
                keybinding: 'ctrlcmd+shift+b'
            });
        }
    }
}
