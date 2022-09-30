import React from 'react';
import { Notes } from '../types';

interface PianoRollNoteProps {
    index: number
    noteId: number
    bar: number
    set: boolean
    current: boolean
    playNote: (note: number) => void
    setCurrentNote: (id: number) => void
    setNote: (noteIndex: number, note: number | undefined) => void
}

export default function PianoRollNote(props: PianoRollNoteProps): JSX.Element {
    const { index, noteId, bar, current, set, playNote, setCurrentNote, setNote } = props;

    const classNames = ['pianoRollNote'];
    if ((index + 1) % bar === 0) {
        classNames.push('nth');
    }
    if (set) {
        classNames.push('set');
    }
    if (current) {
        classNames.push('current');
    }

    const onMouseOver = (e: React.MouseEvent<HTMLElement>) => {
        if (e.buttons === 1) {
            setNote(index, noteId);
            playNote(noteId);
        } else if (e.buttons === 2) {
            setNote(index, undefined);
        }
        e.preventDefault();
    };

    return <div
        className={classNames.join(' ')}
        onClick={() => {
            setNote(index, noteId);
            setCurrentNote(index);
            playNote(noteId);
        }}
        onContextMenu={() => setNote(index, undefined)}
        onMouseOver={e => onMouseOver(e)}
        onMouseLeave={e => onMouseOver(e)}
        title={Notes[noteId]}
    />;
}

