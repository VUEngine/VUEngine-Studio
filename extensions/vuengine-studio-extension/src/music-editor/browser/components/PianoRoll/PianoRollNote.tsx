import React from 'react';
import { MusicEditorStateApi } from '../../ves-music-editor-types';

interface PianoRollNoteProps {
    channel: number
    pattern: number
    index: number
    note: number
    rowHighlight: number
    set: boolean
    stateApi: MusicEditorStateApi
}

export default function PianoRollNote(props: PianoRollNoteProps): JSX.Element {
    const { channel, pattern, index, note, rowHighlight, set, stateApi } = props;

    const classNames = ['pianoRollNote'];
    if ((index + 1) % rowHighlight === 0) {
        classNames.push('nth');
    }
    if (set) {
        classNames.push('set');
    }

    const onMouseOver = (e: React.MouseEvent<HTMLElement>) => {
        if (e.buttons === 1) {
            stateApi.setNote(channel, pattern, index, note);
        } else if (e.buttons === 2) {
            stateApi.setNote(channel, pattern, index, 0);
        }
        e.preventDefault();
    };

    return <div
        className={classNames.join(' ')}
        onClick={() => stateApi.setNote(channel, pattern, index, note)}
        onContextMenu={() => stateApi.setNote(channel, pattern, index, 0)}
        onMouseOver={e => onMouseOver(e)}
        onMouseLeave={e => onMouseOver(e)}
    />;
}

