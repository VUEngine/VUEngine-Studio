import React, { useState } from 'react';
import styled from 'styled-components';
import {
    NOTE_RESOLUTION,
    NOTES_SPECTRUM,
    PIANO_ROLL_KEY_WIDTH,
    ScrollWindow,
    SEQUENCER_RESOLUTION,
    SoundData
} from '../SoundEditorTypes';
import Piano from './Piano';
import PianoRollGrid from './PianoRollGrid';

const StyledPianoRollEditor = styled.div`
    display: flex;
    user-select: none;
    width: fit-content;
`;

const StyledPianoRollGridContainer = styled.div`
    cursor: crosshair;
    left: ${PIANO_ROLL_KEY_WIDTH + 2}px;
    position: sticky;
    z-index: 10;

    canvas {
        position: relative;
        z-index: 1;
    }
`;

const CurrentlyPlacingNote = styled.div`
    border: 1px dashed var(--theia-focusBorder);
    box-sizing: border-box;
    position: absolute;
`;

interface PianoRollEditorProps {
    soundData: SoundData
    currentTrackId: number
    currentPatternId: string
    currentSequenceIndex: number
    noteCursor: number
    setNoteCursor: (note: number) => void
    setNote: (step: number, note?: string, prevStep?: number, duration?: number) => void
    playNote: (note: number) => void
    pianoRollNoteHeight: number
    pianoRollNoteWidth: number
    setPatternAtCursorPosition: (cursor?: number, size?: number, createNew?: boolean) => void
    pianoRollScrollWindow: ScrollWindow
}

export default function PianoRollEditor(props: PianoRollEditorProps): React.JSX.Element {
    const {
        soundData,
        currentTrackId,
        currentPatternId,
        currentSequenceIndex,
        noteCursor, setNoteCursor,
        setNote,
        playNote,
        pianoRollNoteHeight, pianoRollNoteWidth,
        setPatternAtCursorPosition,
        pianoRollScrollWindow,
    } = props;
    const [dragStartNoteId, setDragStartNoteId] = useState<number>(-1);
    const [dragStartStep, setDragStartStep] = useState<number>(-1);
    const [dragEndStep, setDragEndStep] = useState<number>(-1);

    return <StyledPianoRollEditor
        onMouseOut={() => {
            setDragStartNoteId(-1);
            setDragStartStep(-1);
            setDragEndStep(-1);
        }}
        style={{
            width: PIANO_ROLL_KEY_WIDTH + 2 + soundData.size / SEQUENCER_RESOLUTION * NOTE_RESOLUTION * pianoRollNoteWidth,
        }}
    >
        <Piano
            playNote={playNote}
            pianoRollNoteHeight={pianoRollNoteHeight}
            pianoRollScrollWindow={pianoRollScrollWindow}
        />
        <StyledPianoRollGridContainer
            style={{
                height: NOTES_SPECTRUM * pianoRollNoteHeight
            }}
        >
            {dragStartNoteId > -1 &&
                <CurrentlyPlacingNote
                    style={{
                        height: pianoRollNoteHeight,
                        left: Math.min(dragStartStep, dragEndStep) * pianoRollNoteWidth,
                        top: dragStartNoteId * pianoRollNoteHeight,
                        width: pianoRollNoteWidth * (Math.abs(dragStartStep - dragEndStep) + 1),
                    }}
                />
            }
            <PianoRollGrid
                soundData={soundData}
                noteCursor={noteCursor}
                currentTrackId={currentTrackId}
                currentPatternId={currentPatternId}
                currentSequenceIndex={currentSequenceIndex}
                setNoteCursor={setNoteCursor}
                setNote={setNote}
                pianoRollNoteHeight={pianoRollNoteHeight}
                pianoRollNoteWidth={pianoRollNoteWidth}
                setPatternAtCursorPosition={setPatternAtCursorPosition}
                dragStartNoteId={dragStartNoteId}
                dragStartStep={dragStartStep}
                dragEndStep={dragEndStep}
                setDragStartNoteId={setDragStartNoteId}
                setDragStartStep={setDragStartStep}
                setDragEndStep={setDragEndStep}
                pianoRollScrollWindow={pianoRollScrollWindow}
            />
        </StyledPianoRollGridContainer>
    </StyledPianoRollEditor>;
}
