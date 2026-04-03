import { ApplicationShell, Message } from '@theia/core/lib/browser';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { ViewModeService } from '../../../../viewMode/browser/view-mode-service';
import { VesEditorsWidget } from '../../ves-editors-widget';
import { EditorsContext } from '../../ves-editors-types';

@injectable()
export abstract class SoundEditorAbstractSidebarWidget extends ReactWidget {
  @inject(ApplicationShell)
  protected readonly shell: ApplicationShell;
  @inject(ViewModeService)
  protected readonly viewModeService: ViewModeService;

  protected currentWidget: VesEditorsWidget | undefined;

  @postConstruct()
  protected init(): void {
    this.title.closable = false;

    this.bindEvents();

    this.update();
  }

  protected bindEvents(): void {
    this.toDispose.pushAll([
      this.shell.onDidChangeActiveWidget(change => {
        this.checkCurrentWidget();
      }),
      this.shell.onDidRemoveWidget(widget => {
        if (widget.id === this.currentWidget?.id) {
          this.setCurrentWidget(undefined);
        }
      }),
    ]);
  }

  protected onAfterShow(msg: Message): void {
    super.onAfterShow(msg);

    this.checkCurrentWidget();
  }

  protected checkCurrentWidget(widget?: VesEditorsWidget): void {
    const currentWidget = this.shell.getCurrentWidget('main');
    if (currentWidget instanceof VesEditorsWidget && currentWidget.typeId === 'Sound') {
      this.setCurrentWidget(currentWidget);
    } else {
      this.setCurrentWidget(undefined);
    }
  }

  protected setCurrentWidget(widget?: VesEditorsWidget): void {
    if (widget === undefined) {
      this.viewModeService.hideWidget(this);
      this.shell.rightPanelHandler.collapse();
    } else {
      this.viewModeService.showWidget(this);
    }
    this.currentWidget = widget;
    this.update();

    console.log('this.currentWidget.editorsContext', this.currentWidget?.editorsContext);
  }

  protected renderSidebar(widget: VesEditorsWidget): React.ReactNode {
    return <></>;
  };

  protected render(): React.ReactNode {
    return this.currentWidget && this.currentWidget.editorsContext ? (
      <EditorsContext.Provider
        value={this.currentWidget.editorsContext}
      >
        <div className='jsonforms-container'>
          {this.renderSidebar(this.currentWidget)}
        </div>
      </EditorsContext.Provider>
    ) : <></>;
  }
}
