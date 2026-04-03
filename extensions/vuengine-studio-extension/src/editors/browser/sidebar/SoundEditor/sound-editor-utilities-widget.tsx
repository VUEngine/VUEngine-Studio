import { nls } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { SoundEditorAbstractSidebarWidget } from './sound-editor-abstract-sidebar-widget';
import { VesEditorsWidget } from '../../ves-editors-widget';

@injectable()
export class SoundEditorUtilitiesWidget extends SoundEditorAbstractSidebarWidget {
  static readonly ID = 'vesSoundEditorUtilitiesWidget';
  static readonly LABEL = nls.localize('vuengine/editors/sound/utilities', 'Utilities');

  protected init(): void {
    this.id = SoundEditorUtilitiesWidget.ID;
    this.title.iconClass = 'codicon ph ph-wrench';
    this.title.label = SoundEditorUtilitiesWidget.LABEL;
    this.title.caption = SoundEditorUtilitiesWidget.LABEL;

    super.init();
  }

  protected renderSidebar(widget: VesEditorsWidget): React.ReactNode {
    return (
      <></>
    );
  }
}
