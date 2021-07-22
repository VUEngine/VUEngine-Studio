import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { injectable } from 'inversify';
import { VesDocumentationTreeWidget } from './ves-documentation-tree-widget';
import { Command, CommandRegistry, MenuModelRegistry } from '@theia/core';

export namespace VesDocumentationTreeCommands {
  export const OPEN: Command = {
    id: 'ves:documentation:tree:open',
    category: 'Documentation',
    label: 'Open Documentation Sidebar'
  };
}

@injectable()
export class VesDocumentationTreeViewContribution extends AbstractViewContribution<
VesDocumentationTreeWidget
> {
  constructor() {
    super({
      widgetId: VesDocumentationTreeWidget.ID,
      widgetName: VesDocumentationTreeWidget.LABEL,
      defaultWidgetOptions: {
        area: 'right',
        rank: 800,
      },
    });
  }

  async initializeLayout(app: FrontendApplication): Promise<void> {
    this.openView();
  }

  registerCommands(commands: CommandRegistry): void {
    commands.registerCommand(VesDocumentationTreeCommands.OPEN, {
      execute: () => super.openView({ activate: false, reveal: true })
    });
  }

  registerMenus(menus: MenuModelRegistry): void {
    super.registerMenus(menus);
  }
}
