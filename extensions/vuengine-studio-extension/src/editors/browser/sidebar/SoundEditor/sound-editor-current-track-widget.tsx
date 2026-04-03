import { nls } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { VesEditorsWidget } from '../../ves-editors-widget';
import { SoundEditorAbstractSidebarWidget } from './sound-editor-abstract-sidebar-widget';

@injectable()
export class SoundEditorCurrentTrackWidget extends SoundEditorAbstractSidebarWidget {
  static readonly ID = 'vesSoundEditorCurrentTrackWidget';
  static readonly LABEL = nls.localize('vuengine/editors/sound/currentTrack', 'Current Track');

  protected init(): void {
    this.id = SoundEditorCurrentTrackWidget.ID;
    this.title.iconClass = 'codicon ph ph-road-horizon';
    this.title.label = SoundEditorCurrentTrackWidget.LABEL;
    this.title.caption = SoundEditorCurrentTrackWidget.LABEL;

    super.init();
  }

  protected renderSidebar(widget: VesEditorsWidget): React.ReactNode {
    return (
      <></>
    );
  }
}
