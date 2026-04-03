import { nls } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { VesEditorsWidget } from '../../ves-editors-widget';
import { SoundEditorAbstractSidebarWidget } from './sound-editor-abstract-sidebar-widget';

@injectable()
export class SoundEditorCurrentPatternWidget extends SoundEditorAbstractSidebarWidget {
  static readonly ID = 'vesSoundEditorCurrentPatternWidget';
  static readonly LABEL = nls.localize('vuengine/editors/sound/currentPattern', 'Current Pattern');

  protected init(): void {
    this.id = SoundEditorCurrentPatternWidget.ID;
    this.title.iconClass = 'codicon ph ph-rectangle';
    this.title.label = SoundEditorCurrentPatternWidget.LABEL;
    this.title.caption = SoundEditorCurrentPatternWidget.LABEL;

    super.init();
  }

  protected renderSidebar(widget: VesEditorsWidget): React.ReactNode {
    return (
      <></>
    );
  }
}
