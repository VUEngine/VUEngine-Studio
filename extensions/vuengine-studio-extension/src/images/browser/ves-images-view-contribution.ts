import { CommandRegistry, CommandService, MenuModelRegistry } from '@theia/core';
import { AbstractViewContribution, ApplicationShell, CommonMenus, FrontendApplication, KeybindingRegistry } from '@theia/core/lib/browser';
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { inject, injectable } from '@theia/core/shared/inversify';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesCoreCommands } from '../../core/browser/ves-core-commands';
import { VesImagesCommands } from './ves-images-commands';
import { VesImagesWidget } from './ves-images-widget';

@injectable()
export class VesImagesViewContribution extends AbstractViewContribution<VesImagesWidget> implements TabBarToolbarContribution {
    @inject(ApplicationShell)
    protected readonly applicationShell: ApplicationShell;
    @inject(CommandService)
    private readonly commandService: CommandService;
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    constructor() {
        super({
            widgetId: VesImagesWidget.ID,
            widgetName: VesImagesWidget.LABEL,
            defaultWidgetOptions: {
                area: 'right',
                rank: 900,
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
            commandRegistry.registerCommand(VesImagesCommands.WIDGET_TOGGLE, {
                execute: () => this.toggleView()
            });

            commandRegistry.registerCommand(VesImagesCommands.WIDGET_HELP, {
                isEnabled: () => true,
                isVisible: widget => widget !== undefined &&
                    widget.id === VesImagesWidget.ID,
                execute: () => this.commandService.executeCommand(VesCoreCommands.OPEN_DOCUMENTATION.id, 'user-guide/assets', false),
            });
        }
    }

    async registerToolbarItems(toolbar: TabBarToolbarRegistry): Promise<void> {
        await this.workspaceService.ready;
        if (this.workspaceService.opened) {
            toolbar.registerItem({
                id: VesImagesCommands.WIDGET_HELP.id,
                command: VesImagesCommands.WIDGET_HELP.id,
                tooltip: VesImagesCommands.WIDGET_HELP.label,
                priority: 3,
            });
        }
    }

    async registerMenus(menus: MenuModelRegistry): Promise<void> {
        super.registerMenus(menus);

        await this.workspaceService.ready;
        if (this.workspaceService.opened) {
            menus.registerMenuAction(CommonMenus.VIEW_VIEWS, {
                commandId: VesImagesCommands.WIDGET_TOGGLE.id,
                label: this.viewLabel
            });
        }
    }

    async registerKeybindings(keybindings: KeybindingRegistry): Promise<void> {
        super.registerKeybindings(keybindings);

        await this.workspaceService.ready;
        if (this.workspaceService.opened) {
            keybindings.registerKeybinding({
                command: VesImagesCommands.WIDGET_TOGGLE.id,
                keybinding: 'ctrlcmd+shift+i'
            });
        }
    }
}
