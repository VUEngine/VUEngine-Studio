import { nls } from '@theia/core';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';

@injectable()
export class SoundEditorUtilitiesWidget extends ReactWidget {
  static readonly ID = 'vesSoundEditorUtilitiesWidget';
  static readonly LABEL = nls.localize('vuengine/editors/sound/utilities', 'Utilities');

  @postConstruct()
  protected init(): void {
    this.id = SoundEditorUtilitiesWidget.ID;
    this.title.iconClass = 'codicon ph ph-wrench';
    this.title.closable = false;
    this.title.label = SoundEditorUtilitiesWidget.LABEL;
    this.title.caption = SoundEditorUtilitiesWidget.LABEL;

    this.update();
  }

  protected render(): React.ReactNode {
    return (
      <></>
    );
  }
}
