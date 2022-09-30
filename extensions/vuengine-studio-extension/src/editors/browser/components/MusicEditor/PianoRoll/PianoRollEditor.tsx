import React from 'react';
import { HIGHEST_NOTE, LOWEST_NOTE, Notes, PatternConfig } from '../MusicEditorTypes';
import PianoRollRow from './PianoRollRow';

interface PianoRollEditorProps {
    bar: number
    currentNote: number
    pattern: PatternConfig
    playNote: (note: number) => void
    setCurrentNote: (id: number) => void
    setNote: (noteIndex: number, note: number | undefined) => void
}

export default function PianoRollEditor(props: PianoRollEditorProps): JSX.Element {
    const { bar, currentNote, pattern, playNote, setCurrentNote, setNote } = props;

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
                playNote={playNote}
                setCurrentNote={setCurrentNote}
                setNote={setNote}
            />)}
    </div>;
}
