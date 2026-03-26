import { nls } from '@theia/core';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';

@injectable()
export class SoundEditorInstrumentsWidget extends ReactWidget {
  static readonly ID = 'vesSoundEditorInstrumentsWidget';
  static readonly LABEL = nls.localize('vuengine/editors/sound/instrumentEditor', 'Instrument Editor');

  @postConstruct()
  protected init(): void {
    this.id = SoundEditorInstrumentsWidget.ID;
    this.title.iconClass = 'codicon ph ph-guitar';
    this.title.closable = false;
    this.title.label = SoundEditorInstrumentsWidget.LABEL;
    this.title.caption = SoundEditorInstrumentsWidget.LABEL;

    this.update();
  }

  protected render(): React.ReactNode {
    return (
      <></>
    );
  }
}
