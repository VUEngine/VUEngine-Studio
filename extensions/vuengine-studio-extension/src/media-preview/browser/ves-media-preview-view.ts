import { AbstractViewContribution } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesMediaPreviewWidget } from './ves-media-preview-widget';
import { WorkspaceService } from '@theia/workspace/lib/browser';

@injectable()
export class VesMediaPreviewViewContribution extends AbstractViewContribution<VesMediaPreviewWidget> {
  @inject(WorkspaceService)
  protected workspaceService: WorkspaceService;

  constructor() {
    super({
      widgetId: VesMediaPreviewWidget.ID,
      widgetName: VesMediaPreviewWidget.LABEL,
      defaultWidgetOptions: { area: 'main' },
    });
  }
}
