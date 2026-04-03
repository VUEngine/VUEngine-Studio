import { nls } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { SoundEditorAbstractSidebarWidget } from './sound-editor-abstract-sidebar-widget';
import Properties from '../../components/SoundEditor/Other/Properties';
import { SoundData } from '../../components/SoundEditor/SoundEditorTypes';
import { ItemData, VesEditorsWidget } from '../../ves-editors-widget';

@injectable()
export class SoundEditorPropertiesWidget extends SoundEditorAbstractSidebarWidget {
  static readonly ID = 'vesSoundEditorPropertiesWidget';
  static readonly LABEL = nls.localize('vuengine/editors/sound/properties', 'Properties');

  protected init(): void {
    this.id = SoundEditorPropertiesWidget.ID;
    this.title.iconClass = 'codicon ph ph-faders-horizontal';
    this.title.label = SoundEditorPropertiesWidget.LABEL;
    this.title.caption = SoundEditorPropertiesWidget.LABEL;

    super.init();
  }

  protected renderSidebar(widget: VesEditorsWidget): React.ReactNode {
    return (
      <Properties
        soundData={widget.data as unknown as SoundData}
        updateSoundData={(soundData: SoundData) => {
          widget.data = soundData as unknown as ItemData;
        }}
        beats={4}
        bar={16}
        setNewNoteDuration={() => { }}
        setCurrentPlayerPosition={() => { }}
        stepsPerNote={16}
        stepsPerBar={4}
      />
    );
  }
}
