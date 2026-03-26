import { nls } from '@theia/core';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';

@injectable()
export class SoundEditorKeyBindingsWidget extends ReactWidget {
  static readonly ID = 'vesSoundEditorKeyBindingsWidget';
  static readonly LABEL = nls.localizeByDefault('Keybindings');

  @postConstruct()
  protected init(): void {
    this.id = SoundEditorKeyBindingsWidget.ID;
    this.title.iconClass = 'codicon ph ph-keyboard';
    this.title.closable = false;
    this.title.label = SoundEditorKeyBindingsWidget.LABEL;
    this.title.caption = SoundEditorKeyBindingsWidget.LABEL;

    this.update();
  }

  protected render(): React.ReactNode {
    return (
      <></>
    );
  }
}
