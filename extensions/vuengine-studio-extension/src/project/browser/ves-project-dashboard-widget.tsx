import { nls } from '@theia/core';
import { ExtractableWidget, Message } from '@theia/core/lib/browser';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { VesProjectService } from './ves-project-service';

@injectable()
export class VesProjectDashboardWidget extends ReactWidget implements ExtractableWidget {
  @inject(VesProjectService)
  protected readonly vesProjectService: VesProjectService;

  static readonly ID = 'vesProjectDashboardWidget';
  static readonly LABEL = nls.localize(
    'vuengine/project/dashboard',
    'Project Dashboard'
  );

  protected resource = '';

  isExtractable: boolean = true;
  secondaryWindow: Window | undefined;

  @postConstruct()
  protected init(): void {
    this.doInit();

    const label = nls.localize(
      'vuengine/project/project',
      'Project'
    );

    this.id = VesProjectDashboardWidget.ID;
    this.title.label = label;
    this.title.caption = 'Project Dashboard';
    this.title.iconClass = 'fa fa-th';
    this.title.closable = true;

    this.node.style.outline = 'none';

    this.update();
  }

  protected async doInit(): Promise<void> {
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.node.tabIndex = 0;
    this.node.focus();
  }

  protected render(): React.ReactNode {
    return (
      <>
      </>
    );
  }
}
