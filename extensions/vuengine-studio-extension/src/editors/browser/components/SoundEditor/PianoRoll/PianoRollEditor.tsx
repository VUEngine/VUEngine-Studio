import React, { useMemo } from 'react';
import styled from 'styled-components';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';
import { BAR_NOTE_RESOLUTION, NOTES_SPECTRUM, SEQUENCER_RESOLUTION, SoundData, SoundEvent } from '../SoundEditorTypes';
import Piano from './Piano';
import PianoRollGrid from './PianoRollGrid';
import PianoRollPlacedNote from './PianoRollPlacedNote';

const StyledPianoRollEditor = styled.div`
    display: flex;
    user-select: none;
    width: fit-content;
`;

const StyledPianoRollGridContainer = styled.div`
    cursor: crosshair;
    position: relative;
    z-index: 10;

    canvas {
        position: relative;
        z-index: 1;
    }
`;

interface PianoRollEditorProps {
    soundData: SoundData
    currentTrackId: number
    currentPatternId: string
    currentSequenceIndex: number
    noteCursor: number
    setNoteCursor: (note: number) => void
    setNote: (step: number, note?: string, prevStep?: number) => void
    setNoteEvent: (step: number, event: SoundEvent, value?: any) => void
    playNote: (note: number) => void
    noteSnapping: boolean
    pianoRollNoteHeight: number
    pianoRollNoteWidth: number
    setPatternAtCursorPosition: (cursor?: number, createNew?: boolean) => void
}

export default function PianoRollEditor(props: PianoRollEditorProps): React.JSX.Element {
    const {
        soundData,
        currentTrackId,
        currentPatternId,
        currentSequenceIndex,
        noteCursor, setNoteCursor,
        setNote,
        setNoteEvent,
        playNote,
        noteSnapping,
        pianoRollNoteHeight, pianoRollNoteWidth,
        setPatternAtCursorPosition,
    } = props;

    const placedNotesCurrentPattern = useMemo(() => {
        const track = soundData.tracks[currentTrackId];
        const patternId = track?.sequence[currentSequenceIndex];
        const pattern = soundData.patterns[patternId];
        if (!pattern) {
            return;
        }
        const result: React.JSX.Element[] = [];
        Object.keys(pattern.events).map(stepStr => {
            const step = parseInt(stepStr);
            const noteLabel = pattern.events[step][SoundEvent.Note] ?? '';
            const noteDuration = pattern.events[step][SoundEvent.Duration] ?? 1;
            // eslint-disable-next-line no-null/no-null
            if (noteLabel !== undefined && noteLabel !== null && noteLabel !== '') {
                const instrumentId = pattern.events[step][SoundEvent.Instrument] ?? track.instrument;
                const instrument = soundData.instruments[instrumentId];
                const instrumentColor = COLOR_PALETTE[instrument?.color ?? DEFAULT_COLOR_INDEX];
                result.push(
                    <PianoRollPlacedNote
                        key={step}
                        instrumentColor={instrumentColor}
                        noteLabel={noteLabel}
                        step={currentSequenceIndex * BAR_NOTE_RESOLUTION / SEQUENCER_RESOLUTION + step}
                        duration={noteDuration}
                        currentSequenceIndex={currentSequenceIndex}
                        noteCursor={noteCursor}
                        setNoteCursor={setNoteCursor}
                        setNote={setNote}
                        setNoteEvent={setNoteEvent}
                        events={pattern.events}
                        patternSize={pattern.size}
                        noteSnapping={noteSnapping}
                        pianoRollNoteHeight={pianoRollNoteHeight}
                        pianoRollNoteWidth={pianoRollNoteWidth}
                    />
                );
            }
        });

        return result;
    }, [
        soundData.tracks[currentTrackId],
        currentTrackId,
        currentPatternId, // TODO
        currentSequenceIndex, // TODO
        noteCursor,
        soundData.instruments,
        setNote,
    ]);

    return <StyledPianoRollEditor>
        <Piano
            playNote={playNote}
            pianoRollNoteHeight={pianoRollNoteHeight}
        />
        <StyledPianoRollGridContainer
            style={{
                height: NOTES_SPECTRUM * pianoRollNoteHeight
            }}
        >
            {placedNotesCurrentPattern}
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
            />
        </StyledPianoRollGridContainer>
    </StyledPianoRollEditor>;
}
