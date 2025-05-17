import React, { useMemo } from 'react';
import styled from 'styled-components';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';
import { BAR_NOTE_RESOLUTION, NOTES_SPECTRUM, PIANO_ROLL_NOTE_HEIGHT, SoundData, SoundEvent } from '../SoundEditorTypes';
import Piano from './Piano';
import PianoRollGrid from './PianoRollGrid';
import PianoRollPlacedNote from './PianoRollPlacedNote';

const StyledPianoRollEditor = styled.div`
    display: flex;
    flex-grow: 1;
    user-select: none;
`;

const StyledPianoRollGridContainer = styled.div`
    cursor: crosshair;
    height: ${NOTES_SPECTRUM * PIANO_ROLL_NOTE_HEIGHT}px; 
    position: relative;
    z-index: 10;

    canvas {
        position: relative;
        z-index: 1;
    }
`;

interface PianoRollEditorProps {
    soundData: SoundData
    currentChannelId: number
    currentPatternId: string
    currentSequenceIndex: number
    noteCursor: number
    setNoteCursor: (note: number) => void
    setNote: (step: number, note?: number, prevStep?: number) => void
    setNoteEvent: (step: number, event: SoundEvent, value?: any) => void
    playNote: (note: number) => void
    noteSnapping: boolean
}

export default function PianoRollEditor(props: PianoRollEditorProps): React.JSX.Element {
    const {
        soundData,
        currentChannelId,
        currentPatternId,
        currentSequenceIndex,
        noteCursor, setNoteCursor,
        setNote,
        setNoteEvent,
        playNote,
        noteSnapping,
    } = props;

    const placedNotesCurrentPattern = useMemo(() => {
        const channel = soundData.channels[currentChannelId];
        const patternId = channel?.sequence[currentSequenceIndex];
        const pattern = soundData.patterns[patternId];
        if (!pattern) {
            return;
        }
        const result: React.JSX.Element[] = [];
        Object.keys(pattern.events).map(stepStr => {
            const step = parseInt(stepStr);
            const note = pattern.events[step][SoundEvent.Note] ?? -1;
            const noteDuration = pattern.events[step][SoundEvent.Duration] ?? 1;
            // eslint-disable-next-line no-null/no-null
            if (note !== undefined && note !== null && note > -1) {
                const instrumentId = pattern.events[step][SoundEvent.Instrument] ?? channel.instrument;
                const instrument = soundData.instruments[instrumentId];
                const instrumentColor = COLOR_PALETTE[instrument?.color ?? DEFAULT_COLOR_INDEX];
                result.push(
                    <PianoRollPlacedNote
                        key={step}
                        instrumentColor={instrumentColor}
                        note={note}
                        step={currentSequenceIndex * BAR_NOTE_RESOLUTION + step}
                        duration={noteDuration}
                        currentSequenceIndex={currentSequenceIndex}
                        noteCursor={noteCursor}
                        setNoteCursor={setNoteCursor}
                        setNote={setNote}
                        setNoteEvent={setNoteEvent}
                        events={pattern.events}
                        patternSize={pattern.size}
                        noteSnapping={noteSnapping}
                    />
                );
            }
        });

        return result;
    }, [
        soundData.channels[currentChannelId],
        currentChannelId,
        currentPatternId, // TODO
        currentSequenceIndex, // TODO
        noteCursor,
        soundData.instruments,
        setNote,
    ]);

    return <StyledPianoRollEditor>
        <Piano
            playNote={playNote}
        />
        <StyledPianoRollGridContainer>
            {placedNotesCurrentPattern}
            <PianoRollGrid
                soundData={soundData}
                noteCursor={noteCursor}
                currentChannelId={currentChannelId}
                currentPatternId={currentPatternId}
                currentSequenceIndex={currentSequenceIndex}
                setNoteCursor={setNoteCursor}
                setNote={setNote}
            />
        </StyledPianoRollGridContainer>
    </StyledPianoRollEditor>;
}
