import { nls } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { VesEditorsWidget } from '../../ves-editors-widget';
import { SoundEditorAbstractSidebarWidget } from './sound-editor-abstract-sidebar-widget';

@injectable()
export class SoundEditorKeyBindingsWidget extends SoundEditorAbstractSidebarWidget {
  static readonly ID = 'vesSoundEditorKeyBindingsWidget';
  static readonly LABEL = nls.localizeByDefault('Keybindings');

  protected init(): void {
    this.id = SoundEditorKeyBindingsWidget.ID;
    this.title.iconClass = 'codicon ph ph-keyboard';
    this.title.label = SoundEditorKeyBindingsWidget.LABEL;
    this.title.caption = SoundEditorKeyBindingsWidget.LABEL;

    super.init();
  }

  protected renderSidebar(widget: VesEditorsWidget): React.ReactNode {
    return (
      <></>
    );
  }
}
