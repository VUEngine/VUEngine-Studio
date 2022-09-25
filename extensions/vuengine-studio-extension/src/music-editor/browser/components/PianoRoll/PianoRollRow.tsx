import React from 'react';
import { MusicEditorStateApi, PatternConfig } from '../../ves-music-editor-types';
import PianoRollKey from './PianoRollKey';
import PianoRollNote from './PianoRollNote';

interface PianoRollRowProps {
    note: string
    noteId: number
    pattern: PatternConfig
    bar: number
    stateApi: MusicEditorStateApi
}

export default function PianoRollRow(props: PianoRollRowProps): JSX.Element {
    const { note, noteId, pattern, bar, stateApi } = props;

    const classNames = ['pianoRollRow'];
    if (note.startsWith('C') && note.length === 2) {
        classNames.push('cNote');
    }

    return <div className={classNames.join(' ')}>
        <PianoRollKey note={note} />
        {[...Array(pattern.size)].map((x, index) => (
            <PianoRollNote
                key={`pianoroll-row-${index}-note-${note}`}
                pattern={pattern}
                index={index}
                noteId={noteId}
                bar={bar}
                set={pattern.notes[index]?.note === noteId}
                stateApi={stateApi}
            />
        ))}
    </div>;
}
