import React, { Dispatch, SetStateAction } from 'react';
import { MAX_PATTERN_SIZE, NOTE_RESOLUTION } from '../SoundEditorTypes';
import PianoRollKey from './PianoRollKey';
import PianoRollNote from './PianoRollNote';
import { StyledPianoRollRow } from './StyledComponents';

interface PianoRollRowProps {
    note: string
    noteId: number
    setCurrentTick: (note: number) => void
    playNote: (note: number) => void
    setPlaceNote: Dispatch<SetStateAction<number>>
    setPlaceNoteStep: Dispatch<SetStateAction<number>>
}

export default function PianoRollRow(props: PianoRollRowProps): React.JSX.Element {
    const {
        note,
        noteId,
        setCurrentTick,
        playNote,
        setPlaceNote, setPlaceNoteStep,
    } = props;

    return <StyledPianoRollRow>
        <PianoRollKey
            noteId={noteId}
            note={note}
            playNote={playNote}
        />
        {[...Array(MAX_PATTERN_SIZE * NOTE_RESOLUTION)].map((x, colIndex) =>
            <PianoRollNote
                key={colIndex}
                step={colIndex}
                noteId={noteId}
                setCurrentTick={setCurrentTick}
                playNote={playNote}
                setPlaceNote={setPlaceNote}
                setPlaceNoteStep={setPlaceNoteStep}
            />
        )}
    </StyledPianoRollRow>;
};
