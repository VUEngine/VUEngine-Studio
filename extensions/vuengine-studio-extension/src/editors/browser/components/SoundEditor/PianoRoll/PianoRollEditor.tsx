import React, { Dispatch, RefObject, SetStateAction, useState } from 'react';
import styled from 'styled-components';
import { SetNoteProps } from '../SoundEditor';
import {
    NOTE_RESOLUTION,
    NOTES_SPECTRUM,
    PIANO_ROLL_KEY_WIDTH,
    ScrollWindow,
    SEQUENCER_RESOLUTION,
    SoundData,
    TrackSettings
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

const Marquee = styled.div`
    background: var(--theia-selection-background);
    border-left: 1px dashed var(--theia-focusBorder);
    border-right: 1px dashed var(--theia-focusBorder);
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
    setNote: (notes: SetNoteProps[]) => void
    playNote: (note: string, instrumentId?: string) => void
    setSelectedNotes: Dispatch<SetStateAction<number[]>>
    pianoRollNoteHeight: number
    pianoRollNoteWidth: number
    setPatternAtCursorPosition: (cursor?: number, size?: number) => Promise<boolean>
    pianoRollScrollWindow: ScrollWindow
    pianoRollRef: RefObject<HTMLDivElement>
    trackSettings: TrackSettings[]
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
        setSelectedNotes,
        pianoRollNoteHeight, pianoRollNoteWidth,
        setPatternAtCursorPosition,
        pianoRollScrollWindow,
        pianoRollRef,
        trackSettings,
    } = props;
    const [dragNoteId, setDragNoteId] = useState<number>(-1);
    const [dragStartStep, setDragStartStep] = useState<number>(-1);
    const [dragEndStep, setDragEndStep] = useState<number>(-1);
    const [marqueeStartStep, setMarqueeStartStep] = useState<number>(-1);
    const [marqueeEndStep, setMarqueeEndStep] = useState<number>(-1);

    return <StyledPianoRollEditor
        onMouseOut={() => {
            setDragNoteId(-1);
            setDragStartStep(-1);
            setDragEndStep(-1);
            setMarqueeStartStep(-1);
            setMarqueeEndStep(-1);
        }}
        style={{
            width: PIANO_ROLL_KEY_WIDTH + 2 + soundData.size / SEQUENCER_RESOLUTION * NOTE_RESOLUTION * pianoRollNoteWidth,
        }}
    >
        <Piano
            playNote={playNote}
            pianoRollNoteHeight={pianoRollNoteHeight}
        />
        <StyledPianoRollGridContainer
            style={{
                height: NOTES_SPECTRUM * pianoRollNoteHeight
            }}
        >
            {dragNoteId > -1 &&
                <CurrentlyPlacingNote
                    style={{
                        height: pianoRollNoteHeight,
                        left: Math.min(dragStartStep, dragEndStep) * pianoRollNoteWidth - pianoRollScrollWindow.x,
                        top: dragNoteId * pianoRollNoteHeight,
                        width: pianoRollNoteWidth * (Math.abs(dragStartStep - dragEndStep) + 1),
                    }}
                />
            }
            {marqueeStartStep > -1 &&
                <Marquee
                    style={{
                        bottom: 0,
                        left: Math.min(marqueeStartStep, marqueeEndStep) * pianoRollNoteWidth - pianoRollScrollWindow.x - 0.5,
                        top: 0,
                        width: pianoRollNoteWidth * (Math.abs(marqueeStartStep - marqueeEndStep) + 1),
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
                dragNoteId={dragNoteId}
                setDragNoteId={setDragNoteId}
                dragStartStep={dragStartStep}
                setDragStartStep={setDragStartStep}
                dragEndStep={dragEndStep}
                setDragEndStep={setDragEndStep}
                marqueeStartStep={marqueeStartStep}
                setMarqueeStartStep={setMarqueeStartStep}
                marqueeEndStep={marqueeEndStep}
                setMarqueeEndStep={setMarqueeEndStep}
                pianoRollScrollWindow={pianoRollScrollWindow}
                pianoRollRef={pianoRollRef}
                trackSettings={trackSettings}
                setSelectedNotes={setSelectedNotes}
            />
        </StyledPianoRollGridContainer>
    </StyledPianoRollEditor>;
}
