import { nls } from '@theia/core';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';

@injectable()
export class SoundEditorPropertiesWidget extends ReactWidget {
  static readonly ID = 'vesSoundEditorPropertiesWidget';
  static readonly LABEL = nls.localize('vuengine/editors/sound/properties', 'Properties');

  @postConstruct()
  protected init(): void {
    this.id = SoundEditorPropertiesWidget.ID;
    this.title.iconClass = 'codicon ph ph-faders-horizontal';
    this.title.closable = false;
    this.title.label = SoundEditorPropertiesWidget.LABEL;
    this.title.caption = SoundEditorPropertiesWidget.LABEL;

    this.update();
  }

  protected render(): React.ReactNode {
    return (
      <></>
    );
  }
}
