import { nls } from '@theia/core';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { VesCommonService } from '../../../core/browser/ves-common-service';

export const VesMusicEditorWidgetOptions = Symbol('VesMusicEditorWidgetOptions');
export interface VesMusicEditorWidgetOptions {
  uri: string;
}

@injectable()
export class VesMusicEditorWidget extends ReactWidget {
  @inject(VesCommonService)
  protected readonly vesCommonService: VesCommonService;
  @inject(VesMusicEditorWidgetOptions)
  protected readonly options: VesMusicEditorWidgetOptions;

  static readonly ID = 'vesMusicEditorWidget';
  static readonly LABEL = nls.localize('vuengine/musicEditor/musicEditor', 'Music Editor');

  @postConstruct()
  protected async init(): Promise<void> {
    const label = this.options
      ? this.vesCommonService.basename(this.options.uri)
      : VesMusicEditorWidget.LABEL;
    const caption = this.options ? this.options.uri : VesMusicEditorWidget.LABEL;

    this.id = VesMusicEditorWidget.ID;
    this.title.label = label;
    this.title.caption = caption;
    this.title.iconClass = 'fa fa-music';
    this.title.closable = true;

    this.update();
  }

  protected render(): React.ReactNode {
    return <div className='test'>Hi!</div>;
  }
}
