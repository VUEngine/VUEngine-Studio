import React from 'react';
import { HIGHEST_NOTE, LOWEST_NOTE, MusicEditorStateApi, Notes, PatternConfig } from '../types';
import PianoRollRow from './PianoRollRow';

interface PianoRollEditorProps {
    bar: number
    currentNote: number
    pattern: PatternConfig
    stateApi: MusicEditorStateApi
    playNote: (note: number) => void
    setCurrentNote: (id: number) => void
}

export default function PianoRollEditor(props: PianoRollEditorProps): JSX.Element {
    const { bar, currentNote, pattern, stateApi, playNote, setCurrentNote } = props;

    const classNames = ['pianoRollEditor'];

    return <div className={classNames.join(' ')}>
        {Notes.map((note, index) =>
            index <= LOWEST_NOTE &&
            index >= HIGHEST_NOTE && <PianoRollRow
                key={`pianoroll-row-${index}`}
                note={note}
                noteId={index}
                pattern={pattern}
                bar={bar}
                currentNote={currentNote}
                stateApi={stateApi}
                playNote={playNote}
                setCurrentNote={setCurrentNote}
            />)}
    </div>;
}
