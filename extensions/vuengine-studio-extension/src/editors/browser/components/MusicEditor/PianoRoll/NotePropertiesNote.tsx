import React from 'react';
import { MetaLineNote, MetaLineNoteEffects, MetaLineNoteVolume, MetaLineNoteVolumeChannel } from './StyledComponents';

interface NotePropertiesNoteProps {
    index: number
    current: boolean
    effects: string[]
    volumeL: number
    volumeR: number
    noteResolution: number
    setCurrentNote: (currentNote: number) => void
    setNote: (index: number, note: number | undefined) => void
}

export default function NotePropertiesNote(props: NotePropertiesNoteProps): React.JSX.Element {
    const { index, current, volumeL, volumeR, effects, setCurrentNote, setNote } = props;

    return <MetaLineNote
        className={current ? 'current' : undefined}
        onClick={() => setCurrentNote(index)}
        onContextMenu={() => setNote(index, undefined)}
    >
        <MetaLineNoteEffects>
            {effects.join('/')}
        </MetaLineNoteEffects>
        <MetaLineNoteVolume>
            <MetaLineNoteVolumeChannel style={{ height: `${volumeL}%` }} />
            <MetaLineNoteVolumeChannel style={{ height: `${volumeR}%` }} />
        </MetaLineNoteVolume>
    </MetaLineNote>;
}
