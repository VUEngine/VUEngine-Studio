import { CommandRegistry, MenuModelRegistry } from '@theia/core';
import { AbstractViewContribution, CommonMenus, FrontendApplication, KeybindingRegistry } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesProjectCommands } from '../ves-project-commands';
import { VesProjectTreeWidget } from './ves-project-tree-widget';

@injectable()
export class VesProjectTreeViewContribution extends AbstractViewContribution<VesProjectTreeWidget> {
  @inject(WorkspaceService)
  protected readonly workspaceService: WorkspaceService;

  constructor() {
    super({
      widgetId: VesProjectTreeWidget.ID,
      widgetName: VesProjectTreeWidget.LABEL,
      defaultWidgetOptions: {
        area: 'left',
        rank: 1,
      }
    });
  }

  async initializeLayout(app: FrontendApplication): Promise<void> {
    await this.workspaceService.ready;
    if (this.workspaceService.opened) {
      this.openView({ activate: false, reveal: false });
    }
  }

  async registerCommands(commands: CommandRegistry): Promise<void> {
    super.registerCommands(commands);

    await this.workspaceService.ready;
    if (this.workspaceService.opened) {
      commands.registerCommand(VesProjectCommands.TOGGLE_WIDGET, {
        execute: () => this.toggleView()
      });
    }
  }

  async registerMenus(menus: MenuModelRegistry): Promise<void> {
    super.registerMenus(menus);

    await this.workspaceService.ready;
    if (this.workspaceService.opened) {
      menus.registerMenuAction(CommonMenus.VIEW_VIEWS, {
        commandId: VesProjectCommands.TOGGLE_WIDGET.id,
        label: this.viewLabel
      });
    }
  }

  async registerKeybindings(keybindings: KeybindingRegistry): Promise<void> {
    super.registerKeybindings(keybindings);

    await this.workspaceService.ready;
    if (this.workspaceService.opened) {
      keybindings.registerKeybinding({
        command: VesProjectCommands.TOGGLE_WIDGET.id,
        keybinding: 'ctrlcmd+shift+space'
      });
    }
  }
}
