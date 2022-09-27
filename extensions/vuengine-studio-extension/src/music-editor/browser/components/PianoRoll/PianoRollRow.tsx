import React from 'react';
import { MusicEditorStateApi, PatternConfig } from '../../ves-music-editor-types';
import PianoRollKey from './PianoRollKey';
import PianoRollNote from './PianoRollNote';

interface PianoRollRowProps {
    note: string
    noteId: number
    pattern: PatternConfig
    bar: number
    currentNote: number
    stateApi: MusicEditorStateApi
    playNote: (note: number) => void
}

export default function PianoRollRow(props: PianoRollRowProps): JSX.Element {
    const { note, noteId, pattern, bar, currentNote, stateApi, playNote } = props;

    const classNames = ['pianoRollRow'];
    if (note.startsWith('C') && note.length === 2) {
        classNames.push('cNote');
    }

    return <div className={classNames.join(' ')}>
        <PianoRollKey
            noteId={noteId}
            note={note}
            playNote={playNote}
        />
        {[...Array(pattern.size)].map((x, index) => (
            <PianoRollNote
                key={`pianoroll-row-${index}-note-${note}`}
                index={index}
                noteId={noteId}
                bar={bar}
                current={currentNote === index}
                set={pattern.notes[index] === noteId}
                stateApi={stateApi}
                playNote={playNote}
            />
        ))}
    </div>;
}
