import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { VesDocumentationTreeWidget } from './ves-documentation-tree-widget';
import { MenuModelRegistry } from '@theia/core';

// TODO: add "collapse all" command to tab tool bar

@injectable()
export class VesDocumentationTreeViewContribution extends AbstractViewContribution<VesDocumentationTreeWidget> {
  constructor() {
    super({
      widgetId: VesDocumentationTreeWidget.ID,
      widgetName: VesDocumentationTreeWidget.LABEL,
      defaultWidgetOptions: {
        area: 'right',
        rank: 1100,
      },
      toggleCommandId: 'vesDocumentation.toggle',
      toggleKeybinding: 'ctrlcmd+shift+d',
    });
  }

  async initializeLayout(app: FrontendApplication): Promise<void> {
    this.openView({ activate: false, reveal: false });
  }

  registerMenus(menus: MenuModelRegistry): void {
    super.registerMenus(menus);
  }
}
