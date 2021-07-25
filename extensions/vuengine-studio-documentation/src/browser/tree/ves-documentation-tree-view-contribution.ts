import { AbstractViewContribution, FrontendApplication } from '@theia/core/lib/browser';
import { injectable } from 'inversify';
import { VesDocumentationTreeWidget } from './ves-documentation-tree-widget';
import { MenuModelRegistry } from '@theia/core';

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

  registerMenus(menus: MenuModelRegistry): void {
    super.registerMenus(menus);
  }
}
