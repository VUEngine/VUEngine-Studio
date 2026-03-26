import { nls } from '@theia/core';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';

@injectable()
export class SoundEditorCurrentTrackWidget extends ReactWidget {
  static readonly ID = 'vesSoundEditorCurrentTrackWidget';
  static readonly LABEL = nls.localize('vuengine/editors/sound/currentTrack', 'Current Track');

  @postConstruct()
  protected init(): void {
    this.id = SoundEditorCurrentTrackWidget.ID;
    this.title.iconClass = 'codicon ph ph-road-horizon';
    this.title.closable = false;
    this.title.label = SoundEditorCurrentTrackWidget.LABEL;
    this.title.caption = SoundEditorCurrentTrackWidget.LABEL;

    this.update();
  }

  protected render(): React.ReactNode {
    return (
      <></>
    );
  }
}
