import React from 'react';
import { MusicEditorStateApi, Notes, PatternConfig } from '../../ves-music-editor-types';

interface PianoRollNoteProps {
    pattern: PatternConfig
    index: number
    noteId: number
    bar: number
    set: boolean
    current: boolean
    stateApi: MusicEditorStateApi
}

export default function PianoRollNote(props: PianoRollNoteProps): JSX.Element {
    const { pattern, index, noteId, bar, current, set, stateApi } = props;

    const note = pattern.notes[index] ?? {
        note: noteId,
        volumeL: undefined,
        volumeR: undefined,
        effects: [],
    };

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
            stateApi.setNote(pattern.channel, pattern.id, index, {
                ...note,
                note: noteId
            });
        } else if (e.buttons === 2) {
            stateApi.setNote(pattern.channel, pattern.id, index, {
                ...note,
                note: undefined
            });
        }
        e.preventDefault();
    };

    return <div
        className={classNames.join(' ')}
        onClick={() => {
            stateApi.setNote(pattern.channel, pattern.id, index, {
                ...note,
                note: noteId
            });
            stateApi.setCurrentNote(index);
        }}
        onContextMenu={() => stateApi.setNote(pattern.channel, pattern.id, index, {
            ...note,
            note: undefined
        })}
        onMouseOver={e => onMouseOver(e)}
        onMouseLeave={e => onMouseOver(e)}
        title={Notes[noteId]}
    />;
}

