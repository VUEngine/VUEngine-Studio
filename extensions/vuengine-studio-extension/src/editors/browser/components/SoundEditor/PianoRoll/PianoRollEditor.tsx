import React, { Dispatch, RefObject, SetStateAction, useState } from 'react';
import styled from 'styled-components';
import {
    EventsMap,
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
    border: 1px dashed var(--theia-focusBorder);
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
    setNotes: (notes: EventsMap) => void
    playNote: (note: string, instrumentId?: string) => void
    setSelectedNotes: Dispatch<SetStateAction<number[]>>
    newNoteDuration: number
    pianoRollNoteHeight: number
    pianoRollNoteWidth: number
    setPatternAtCursorPosition: (cursor?: number, size?: number) => Promise<void>
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
        setNotes,
        playNote,
        setSelectedNotes,
        newNoteDuration,
        pianoRollNoteHeight, pianoRollNoteWidth,
        setPatternAtCursorPosition,
        pianoRollScrollWindow,
        pianoRollRef,
        trackSettings,
    } = props;
    const [noteDragNoteId, setNoteDragNoteId] = useState<number>(-1);
    const [noteDragStartStep, setNoteDragStartStep] = useState<number>(-1);
    const [noteDragEndStep, setNoteDragEndStep] = useState<number>(-1);
    const [marqueeStartStep, setMarqueeStartStep] = useState<number>(-1);
    const [marqueeEndStep, setMarqueeEndStep] = useState<number>(-1);
    const [marqueeStartNote, setMarqueeStartNote] = useState<number>(-1);
    const [marqueeEndNote, setMarqueeEndNote] = useState<number>(-1);

    return <StyledPianoRollEditor
        onMouseOut={() => {
            setNoteDragNoteId(-1);
            setNoteDragStartStep(-1);
            setNoteDragEndStep(-1);
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
            {noteDragNoteId > -1 &&
                <CurrentlyPlacingNote
                    style={{
                        height: pianoRollNoteHeight,
                        left: Math.min(noteDragStartStep, noteDragEndStep) * pianoRollNoteWidth - pianoRollScrollWindow.x,
                        top: noteDragNoteId * pianoRollNoteHeight,
                        width: pianoRollNoteWidth * (Math.abs(noteDragStartStep - noteDragEndStep) + 1),
                    }}
                />
            }
            {marqueeStartStep > -1 &&
                <Marquee
                    style={{
                        height: (Math.abs(marqueeStartNote - marqueeEndNote) + 1) * pianoRollNoteHeight,
                        left: Math.min(marqueeStartStep, marqueeEndStep) * pianoRollNoteWidth - pianoRollScrollWindow.x - 0.5,
                        top: Math.min(marqueeStartNote, marqueeEndNote) * pianoRollNoteHeight - 0.5,
                        width: (Math.abs(marqueeStartStep - marqueeEndStep) + 1) * pianoRollNoteWidth,
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
                setNotes={setNotes}
                newNoteDuration={newNoteDuration}
                pianoRollNoteHeight={pianoRollNoteHeight}
                pianoRollNoteWidth={pianoRollNoteWidth}
                setPatternAtCursorPosition={setPatternAtCursorPosition}
                noteDragNoteId={noteDragNoteId}
                setNoteDragNoteId={setNoteDragNoteId}
                noteDragStartStep={noteDragStartStep}
                setNoteDragStartStep={setNoteDragStartStep}
                noteDragEndStep={noteDragEndStep}
                setNoteDragEndStep={setNoteDragEndStep}
                marqueeStartStep={marqueeStartStep}
                setMarqueeStartStep={setMarqueeStartStep}
                marqueeEndStep={marqueeEndStep}
                setMarqueeEndStep={setMarqueeEndStep}
                marqueeStartNote={marqueeStartNote}
                setMarqueeStartNote={setMarqueeStartNote}
                marqueeEndNote={marqueeEndNote}
                setMarqueeEndNote={setMarqueeEndNote}
                pianoRollScrollWindow={pianoRollScrollWindow}
                pianoRollRef={pianoRollRef}
                trackSettings={trackSettings}
                setSelectedNotes={setSelectedNotes}
            />
        </StyledPianoRollGridContainer>
    </StyledPianoRollEditor>;
}
