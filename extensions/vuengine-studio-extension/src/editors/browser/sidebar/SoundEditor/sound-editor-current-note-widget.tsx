import { nls } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { VesEditorsWidget } from '../../ves-editors-widget';
import { SoundEditorAbstractSidebarWidget } from './sound-editor-abstract-sidebar-widget';
import NoteProperties from '../../components/SoundEditor/Other/NoteProperties';
import { SoundData, SoundEditorTrackType } from '../../components/SoundEditor/SoundEditorTypes';

@injectable()
export class SoundEditorCurrentNoteWidget extends SoundEditorAbstractSidebarWidget {
  static readonly ID = 'vesSoundEditorCurrentNoteWidget';
  static readonly LABEL = nls.localize('vuengine/editors/sound/currentNote', 'Current Note');

  protected init(): void {
    this.id = SoundEditorCurrentNoteWidget.ID;
    this.title.iconClass = 'codicon ph ph-music-note';
    this.title.label = SoundEditorCurrentNoteWidget.LABEL;
    this.title.caption = SoundEditorCurrentNoteWidget.LABEL;

    super.init();
  }

  protected renderSidebar(widget: VesEditorsWidget): React.ReactNode {
    return (
      <NoteProperties
        soundData={widget.data as unknown as SoundData}
        currentTrackId={0}
        noteSnapping={true}
        setNoteSnapping={() => { }}
        noteCursor={0}
        setNoteCursor={() => { }}
        currentSequenceIndex={0}
        pattern={{
          events: {},
          name: '',
          size: 16,
          type: SoundEditorTrackType.NOISE
        }}
        emulatorInitialized={true}
        playingTestNote={false}
        playNote={() => { }}
        setNotes={() => { }}
        newNoteDuration={16}
        stepsPerBar={16}
      />
    );
  }
}
