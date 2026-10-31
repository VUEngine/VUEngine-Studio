import React, { RefObject, useState } from 'react';
import styled from 'styled-components';
import {
    EventsMap,
    NOTES_SPECTRUM,
    PIANO_ROLL_KEY_WIDTH,
    ScrollWindow,
    SoundData,
    SoundEditorMarqueeMode,
    SoundEditorTool,
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
        z-index: 10;
    }
`;

const CurrentlyPlacingNote = styled.div`
    border: 1px dashed var(--theia-focusBorder);
    box-sizing: border-box;
    position: absolute;
    z-index: 9;
`;

const Marquee = styled.div`
    background: var(--theia-selection-background);
    border: 1px dashed var(--theia-focusBorder);
    border: 1px dashed var(--theia-focusBorder);
    box-sizing: border-box;
    position: absolute;
    z-index: 9;
`;

interface PianoRollEditorProps {
    soundData: SoundData
    editCurrentNote: () => void
    openSongLengthDialog: () => void
    tool: SoundEditorTool
    marqueeMode: SoundEditorMarqueeMode
    currentTrackId: number
    currentPatternId: string
    currentSequenceIndex: number
    currentInstrumentId: string
    setCurrentInstrumentId: (instrumentId: string) => void
    noteCursor: number
    setNoteCursor: (note: number) => void
    setNotes: (notes: EventsMap) => void
    playing: boolean
    testNote: string
    playNote: (note: string, instrumentId?: string) => void
    selectedNotes: number[]
    setSelectedNotes: (sn: number[]) => void
    newNoteDuration: number
    pianoRollNoteHeight: number
    pianoRollNoteWidth: number
    setPatternAtCursorPosition: (cursor?: number, size?: number) => void
    pianoRollScrollWindow: ScrollWindow
    pianoRollRef: RefObject<HTMLDivElement>
    trackSettings: TrackSettings[]
    noteSnapping: boolean
    previewNotes: EventsMap | undefined
    pasting: boolean
    setPastePosition: (position: { step: number, noteId: number }) => void
    commitPaste: () => void
    cancelPaste: () => void
}

export default function PianoRollEditor(props: PianoRollEditorProps): React.JSX.Element {
    const {
        soundData,
        tool, marqueeMode,
        currentTrackId,
        currentPatternId,
        currentSequenceIndex,
        currentInstrumentId,
        setCurrentInstrumentId,
        noteCursor, setNoteCursor,
        setNotes,
        playing, testNote,
        playNote,
        selectedNotes, setSelectedNotes,
        newNoteDuration,
        pianoRollNoteHeight, pianoRollNoteWidth,
        setPatternAtCursorPosition,
        pianoRollScrollWindow,
        pianoRollRef,
        trackSettings,
        editCurrentNote,
        openSongLengthDialog,
        noteSnapping,
        previewNotes, pasting, setPastePosition, commitPaste, cancelPaste,
    } = props;
    const [noteDragNoteId, setNoteDragNoteId] = useState<number>(-1);
    const [noteDragStartStep, setNoteDragStartStep] = useState<number>(-1);
    const [noteDragEndStep, setNoteDragEndStep] = useState<number>(-1);
    const [marqueeStartStep, setMarqueeStartStep] = useState<number>(-1);
    const [marqueeEndStep, setMarqueeEndStep] = useState<number>(-1);
    const [marqueeStartNote, setMarqueeStartNote] = useState<number>(-1);
    const [marqueeEndNote, setMarqueeEndNote] = useState<number>(-1);

    return (
        <StyledPianoRollEditor
            style={{
                // fill the view, even if the sound is shorter
                width: PIANO_ROLL_KEY_WIDTH + 2 + Math.max(soundData.size * pianoRollNoteWidth, pianoRollScrollWindow.w),
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
                <PianoRollGrid
                    soundData={soundData}
                    tool={tool}
                    marqueeMode={marqueeMode}
                    noteCursor={noteCursor}
                    currentTrackId={currentTrackId}
                    currentPatternId={currentPatternId}
                    currentSequenceIndex={currentSequenceIndex}
                    currentInstrumentId={currentInstrumentId}
                    setCurrentInstrumentId={setCurrentInstrumentId}
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
                    selectedNotes={selectedNotes}
                    setSelectedNotes={setSelectedNotes}
                    playNote={playNote}
                    playing={playing}
                    testNote={testNote}
                    editCurrentNote={editCurrentNote}
                    openSongLengthDialog={openSongLengthDialog}
                    noteSnapping={noteSnapping}
                    previewNotes={previewNotes}
                    pasting={pasting}
                    setPastePosition={setPastePosition}
                    commitPaste={commitPaste}
                    cancelPaste={cancelPaste}
                />
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
            </StyledPianoRollGridContainer>
        </StyledPianoRollEditor>
    );
}
