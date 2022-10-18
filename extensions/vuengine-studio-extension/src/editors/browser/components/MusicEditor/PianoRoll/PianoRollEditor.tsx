import React from 'react';
import { HIGHEST_NOTE, LOWEST_NOTE, Notes } from '../MusicEditorTypes';
import PianoRollRow from './PianoRollRow';

export default function PianoRollEditor(): JSX.Element {
    const classNames = ['pianoRollEditor'];

    return <div className={classNames.join(' ')}>
        {Notes.map((note, index) =>
            index <= LOWEST_NOTE &&
            index >= HIGHEST_NOTE && <PianoRollRow
                key={`pianoroll-row-${index}`}
                note={note}
                noteId={index}
            />)}
    </div>;
}
