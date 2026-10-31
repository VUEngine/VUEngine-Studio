import React, { RefObject } from 'react';
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
    setTrackNotes: (notes: EventsMap) => void
    setCurrentSequenceIndex: (trackId: number, sequenceIndex: number) => void
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
        setTrackNotes,
        setCurrentSequenceIndex,
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
                    setTrackNotes={setTrackNotes}
                    setCurrentSequenceIndex={setCurrentSequenceIndex}
                    newNoteDuration={newNoteDuration}
                    pianoRollNoteHeight={pianoRollNoteHeight}
                    pianoRollNoteWidth={pianoRollNoteWidth}
                    setPatternAtCursorPosition={setPatternAtCursorPosition}
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
            </StyledPianoRollGridContainer>
        </StyledPianoRollEditor>
    );
}
