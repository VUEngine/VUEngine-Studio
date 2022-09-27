import React from 'react';
import { MusicEditorStateApi, Notes } from '../../ves-music-editor-types';

interface PianoRollNoteProps {
    index: number
    noteId: number
    bar: number
    set: boolean
    current: boolean
    stateApi: MusicEditorStateApi
    playNote: (note: number) => void
}

export default function PianoRollNote(props: PianoRollNoteProps): JSX.Element {
    const { index, noteId, bar, current, set, stateApi, playNote } = props;

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
            stateApi.setNote(index, noteId);
            playNote(noteId);
        } else if (e.buttons === 2) {
            stateApi.setNote(index, undefined);
        }
        e.preventDefault();
    };

    return <div
        className={classNames.join(' ')}
        onClick={() => {
            stateApi.setNote(index, noteId);
            stateApi.setCurrentNote(index);
            playNote(noteId);
        }}
        onContextMenu={() => stateApi.setNote(index, undefined)}
        onMouseOver={e => onMouseOver(e)}
        onMouseLeave={e => onMouseOver(e)}
        title={Notes[noteId]}
    />;
}

