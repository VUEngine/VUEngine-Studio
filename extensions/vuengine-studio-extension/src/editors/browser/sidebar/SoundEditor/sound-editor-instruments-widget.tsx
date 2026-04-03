import { nls } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { SoundEditorAbstractSidebarWidget } from './sound-editor-abstract-sidebar-widget';
import { VesEditorsWidget } from '../../ves-editors-widget';

@injectable()
export class SoundEditorInstrumentsWidget extends SoundEditorAbstractSidebarWidget {
  static readonly ID = 'vesSoundEditorInstrumentsWidget';
  static readonly LABEL = nls.localize('vuengine/editors/sound/instrumentEditor', 'Instrument Editor');

  protected init(): void {
    this.id = SoundEditorInstrumentsWidget.ID;
    this.title.iconClass = 'codicon ph ph-guitar';
    this.title.label = SoundEditorInstrumentsWidget.LABEL;
    this.title.caption = SoundEditorInstrumentsWidget.LABEL;

    super.init();
  }

  protected renderSidebar(widget: VesEditorsWidget): React.ReactNode {
    return (
      <></>
    );
  }
}
