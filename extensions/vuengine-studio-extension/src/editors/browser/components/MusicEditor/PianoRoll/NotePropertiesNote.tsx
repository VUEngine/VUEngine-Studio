import { nls } from '@theia/core';
import React from 'react';
import { MetaLineNote, MetaLineNoteEffects, MetaLineNoteVolume, MetaLineNoteVolumeChannel } from './StyledComponents';

interface NotePropertiesNoteProps {
    index: number
    effects: string[]
    volumeL: number
    volumeR: number
    noteResolution: number
    setCurrentNote: (currentNote: number) => void
    setNote: (index: number, note: number | undefined) => void
}

export default function NotePropertiesNote(props: NotePropertiesNoteProps): React.JSX.Element {
    const { index, volumeL, volumeR, effects, noteResolution, setCurrentNote, setNote } = props;

    const labelEffects = nls.localize('vuengine/musicEditor/effects', 'Effects');
    const leftLabel = nls.localize('vuengine/musicEditor/left', 'Left');
    const rightLabel = nls.localize('vuengine/musicEditor/right', 'Right');

    return <MetaLineNote
        className={`noteResolution${noteResolution}`}
        title={`${effects.length} ${labelEffects}, ${leftLabel}: ${volumeL}%/${rightLabel}: ${volumeR}%`}
        onClick={() => setCurrentNote(index)}
        onContextMenu={() => setNote(index, undefined)}
    >
        <MetaLineNoteEffects>
        </MetaLineNoteEffects>
        <MetaLineNoteVolume>
            <MetaLineNoteVolumeChannel style={{ height: `${volumeL}%` }} />
            <MetaLineNoteVolumeChannel style={{ height: `${volumeR}%` }} />
        </MetaLineNoteVolume>
    </MetaLineNote>;
}
