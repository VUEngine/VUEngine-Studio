import { nls } from '@theia/core';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { VesCommonService } from '../../../core/browser/ves-common-service';

export const VesScriptEditorWidgetOptions = Symbol('VesScriptEditorWidgetOptions');
export interface VesScriptEditorWidgetOptions {
  uri: string;
}

export interface vesScriptEditorWidgetState {
};

@injectable()
export class VesScriptEditorWidget extends ReactWidget {
  @inject(VesCommonService)
  protected readonly vesCommonService: VesCommonService;
  @inject(VesScriptEditorWidgetOptions)
  protected readonly options: VesScriptEditorWidgetOptions;

  static readonly ID = 'vesScriptEditorWidget';
  static readonly LABEL = nls.localize('vuengine/scriptEditor/scriptEditor', 'Script Editor');

  protected state: vesScriptEditorWidgetState;

  @postConstruct()
  protected async init(): Promise<void> {
    const label = this.options
      ? this.vesCommonService.basename(this.options.uri)
      : VesScriptEditorWidget.LABEL;
    const caption = this.options ? this.options.uri : VesScriptEditorWidget.LABEL;

    this.id = VesScriptEditorWidget.ID;
    this.title.label = label;
    this.title.caption = caption;
    this.title.iconClass = 'fa fa-cog';
    this.title.closable = true;

    this.update();
  }

  protected render(): React.ReactNode {
    return <div className='test'>Hi!</div>;
  }
}
