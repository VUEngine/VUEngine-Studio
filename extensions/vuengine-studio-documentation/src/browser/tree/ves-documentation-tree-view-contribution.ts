import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { injectable } from 'inversify';
import { VesDocumentationTreeWidget } from './ves-documentation-tree-widget';
import { CommandRegistry, MenuModelRegistry } from '@theia/core';
import { VesDocumentationCommands } from '../ves-documentation-commands';

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
        rank: 900,
      },
    });
  }

  async initializeLayout(app: FrontendApplication): Promise<void> {
    this.openView();
  }

  registerCommands(commands: CommandRegistry): void {
    commands.registerCommand(VesDocumentationCommands.OPEN, {
      execute: () => super.openView({ activate: false, reveal: true })
    });
  }

  registerMenus(menus: MenuModelRegistry): void {
    super.registerMenus(menus);
  }
}
