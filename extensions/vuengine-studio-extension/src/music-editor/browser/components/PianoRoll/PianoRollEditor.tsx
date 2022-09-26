import React from 'react';
import { HIGHEST_NOTE, LOWEST_NOTE, MusicEditorStateApi, Notes, PatternConfig } from '../../ves-music-editor-types';
import PianoRollRow from './PianoRollRow';

interface PianoRollEditorProps {
    bar: number
    currentNote: number
    pattern: PatternConfig
    stateApi: MusicEditorStateApi
}

export default function PianoRollEditor(props: PianoRollEditorProps): JSX.Element {
    const { bar, currentNote, pattern, stateApi } = props;

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
            />)}
    </div>;
}
