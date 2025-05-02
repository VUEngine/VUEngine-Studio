import React from 'react';
import { NOTES, SoundEditorTool } from '../SoundEditorTypes';
import { StyledPianoRollEditorTick } from './StyledComponents';

interface PianoRollNoteProps {
    index: number
    noteId: number
    setCurrentTick: (note: number) => void
    setNote: (index: number, note: number | undefined) => void
    playNote: (note: number) => void
    tool: SoundEditorTool
}

export default function PianoRollNote(props: PianoRollNoteProps): React.JSX.Element {
    const { index, noteId, playNote, setCurrentTick, setNote, tool } = props;

    const classNames = [];
    if (Object.keys(NOTES)[noteId].includes('#')) {
        classNames.push('sharpNote');
    }

    const onClick = (e: React.MouseEvent<HTMLElement>) => {
        /*
        if (tool === SoundEditorTool.ERASER) {
            doUnsetNote();
        } else {
        */
        if (tool === SoundEditorTool.DEFAULT) {
            setNote(index, noteId);
            playNote(noteId);
            setCurrentTick(index);
        }
    };

    /*
    const doUnsetNote = () => {
        setNote(index, undefined);
    };
    */

    return <StyledPianoRollEditorTick
        className={classNames.join(' ')}
        onClick={onClick}
    // onContextMenu={doUnsetNote}
    />;
}

