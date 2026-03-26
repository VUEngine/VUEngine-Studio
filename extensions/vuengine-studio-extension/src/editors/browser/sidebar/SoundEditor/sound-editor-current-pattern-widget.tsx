import { nls } from '@theia/core';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';

@injectable()
export class SoundEditorCurrentPatternWidget extends ReactWidget {
  static readonly ID = 'vesSoundEditorCurrentPatternWidget';
  static readonly LABEL = nls.localize('vuengine/editors/sound/currentPattern', 'Current Pattern');

  @postConstruct()
  protected init(): void {
    this.id = SoundEditorCurrentPatternWidget.ID;
    this.title.iconClass = 'codicon ph ph-rectangle';
    this.title.closable = false;
    this.title.label = SoundEditorCurrentPatternWidget.LABEL;
    this.title.caption = SoundEditorCurrentPatternWidget.LABEL;

    this.update();
  }

  protected render(): React.ReactNode {
    return (
      <></>
    );
  }
}
