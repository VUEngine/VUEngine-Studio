import React from 'react';
import { HIGHEST_NOTE, LOWEST_NOTE, NOTES } from '../MusicEditorTypes';
import PianoRollRow from './PianoRollRow';

export default function PianoRollEditor(): React.JSX.Element {
    return <div className="pianoRollEditor">
        {Object.keys(NOTES).map((note, index) =>
            index <= LOWEST_NOTE &&
            index >= HIGHEST_NOTE && <PianoRollRow
                key={`pianoroll-row-${index}`}
                note={note}
                noteId={index}
            />)}
    </div>;
}
