import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { VesProjectTreeWidget } from './ves-project-tree-widget';
import { MenuModelRegistry } from '@theia/core';

@injectable()
export class VesProjectTreeViewContribution extends AbstractViewContribution<VesProjectTreeWidget> {
  constructor() {
    super({
      widgetId: VesProjectTreeWidget.ID,
      widgetName: VesProjectTreeWidget.LABEL,
      defaultWidgetOptions: {
        area: 'left',
        rank: 1,
      },
      toggleCommandId: 'vesProject.toggle',
      toggleKeybinding: 'ctrlcmd+shift+space',
    });
  }

  async initializeLayout(app: FrontendApplication): Promise<void> {
    this.openView({ activate: false, reveal: false });
  }

  registerMenus(menus: MenuModelRegistry): void {
    super.registerMenus(menus);
  }
}
