import { nls } from '@theia/core';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';

@injectable()
export class SoundEditorCurrentNoteWidget extends ReactWidget {
  static readonly ID = 'vesSoundEditorCurrentNoteWidget';
  static readonly LABEL = nls.localize('vuengine/editors/sound/currentNote', 'Current Note');

  @postConstruct()
  protected init(): void {
    this.id = SoundEditorCurrentNoteWidget.ID;
    this.title.iconClass = 'codicon ph ph-music-note';
    this.title.closable = false;
    this.title.label = SoundEditorCurrentNoteWidget.LABEL;
    this.title.caption = SoundEditorCurrentNoteWidget.LABEL;

    this.update();
  }

  protected render(): React.ReactNode {
    return (
      <></>
    );
  }
}
