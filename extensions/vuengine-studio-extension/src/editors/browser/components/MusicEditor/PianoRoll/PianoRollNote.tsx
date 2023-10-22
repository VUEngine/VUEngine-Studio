import React, { useContext } from 'react';
import { MusicEditorContext, MusicEditorContextType, Notes } from '../MusicEditorTypes';

interface PianoRollNoteProps {
    index: number
    noteId: number
    set: boolean
    current: boolean
}

export default function PianoRollNote(props: PianoRollNoteProps): React.JSX.Element {
    const { songData, playNote, setCurrentNote, setNote } = useContext(MusicEditorContext) as MusicEditorContextType;
    const { index, noteId, current, set } = props;

    const classNames = ['pianoRollNote'];
    if ((index + 1) % songData.bar === 0) {
        classNames.push('nth');
    }
    if (set) {
        classNames.push('set');
    }
    if (current) {
        classNames.push('current');
    }

    const onMouse = (e: React.MouseEvent<HTMLElement>) => {
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
        onMouseDown={e => onMouse(e)}
        onMouseOver={e => onMouse(e)}
        title={Notes[noteId]}
    />;
}

