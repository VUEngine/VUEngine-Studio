import React from 'react';
import { MusicEvent } from '../MusicEditorTypes';
import { MetaLineNote, MetaLineNoteEffects } from './StyledComponents';
import { AVAILABLE_EVENTS } from '../Sidebar/AvailableEvents';

interface NotePropertiesNoteProps {
    index: number
    current: boolean
    effects: MusicEvent[]
    noteResolution: number
    setCurrentTick: (currentTick: number) => void
    setNote: (index: number, note: number | undefined) => void
}

export default function NotePropertiesNote(props: NotePropertiesNoteProps): React.JSX.Element {
    const { index, current, effects, setCurrentTick, setNote } = props;

    let effectsLabel;
    if (effects.length > 1) {
        effectsLabel = effects.length;
    } else if (effects.length === 1) {
        effectsLabel = AVAILABLE_EVENTS[effects[0]].shortId;
    }

    return <MetaLineNote
        className={current ? 'current' : undefined}
        onClick={() => setCurrentTick(index)}
        onContextMenu={() => setNote(index, undefined)}
    >
        <MetaLineNoteEffects>
            {effectsLabel}
        </MetaLineNoteEffects>
    </MetaLineNote>;
}
