import React, { Dispatch, SetStateAction } from 'react';
import { NOTES } from '../SoundEditorTypes';
import { StyledPianoRollEditorTick } from './StyledComponents';

interface PianoRollNoteProps {
    step: number
    noteId: number
    setCurrentTick: (note: number) => void
    playNote: (note: number) => void
    setPlaceNote: Dispatch<SetStateAction<number>>
    setPlaceNoteStep: Dispatch<SetStateAction<number>>
}

export default function PianoRollNote(props: PianoRollNoteProps): React.JSX.Element {
    const { step, noteId, playNote, setCurrentTick, setPlaceNote, setPlaceNoteStep } = props;

    const classNames = [];
    if (Object.keys(NOTES)[noteId].includes('#')) {
        classNames.push('sharpNote');
    }

    const onClick = (e: React.MouseEvent<HTMLElement>) => {
        playNote(noteId);
        setCurrentTick(step);
        setPlaceNote(noteId);
        setPlaceNoteStep(step);
    };

    return <StyledPianoRollEditorTick
        className={classNames.join(' ')}
        onClick={onClick}
    />;
}

