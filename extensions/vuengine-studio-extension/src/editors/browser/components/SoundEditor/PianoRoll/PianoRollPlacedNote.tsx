import chroma from 'chroma-js';
import React from 'react';
import { NOTE_RESOLUTION, NOTES, PIANO_ROLL_NOTE_HEIGHT, PIANO_ROLL_NOTE_WIDTH } from '../SoundEditorTypes';
import { StyledPianoRollPlacedNote, StyledPianoRollPlacedNoteDragHandle } from './StyledComponents';

const getLeftOffset = (index: number) =>
    53 + // piano
    1 * Math.floor(index / NOTE_RESOLUTION * 4) + // quarter note separators
    1 * Math.floor(index / NOTE_RESOLUTION) + // full note separators
    index * (PIANO_ROLL_NOTE_WIDTH + 1);

const getTopOffset = (note: number) => 19 + // meta line
    1 * Math.floor(note / 12) + // octave separators
    note * (PIANO_ROLL_NOTE_HEIGHT + 1);

interface PianoRollPlacedNoteProps {
    currentChannelId: number
    channelId: number
    currentTick: number
    setCurrentTick: (playRangeEnd: number) => void
    note: number
    duration: number
    step: number
    instrumentColor: string
    setNote: (step: number, note?: number) => void
}

export default function PianoRollPlacedNote(props: PianoRollPlacedNoteProps): React.JSX.Element {
    const {
        channelId, currentChannelId,
        currentTick, setCurrentTick,
        note, duration,
        step,
        instrumentColor,
        setNote: removeNote,
    } = props;

    const left = getLeftOffset(step);
    const lastNoteLeft = getLeftOffset(step + duration - 1);
    const top = getTopOffset(note);
    const width = lastNoteLeft - left + PIANO_ROLL_NOTE_WIDTH;

    return (
        <StyledPianoRollPlacedNote
            className={channelId !== currentChannelId
                ? 'oc'
                : currentTick === step
                    ? 'selected'
                    : undefined
            }
            style={{
                backgroundColor: channelId !== currentChannelId
                    ? undefined
                    : instrumentColor,
                color: channelId !== currentChannelId
                    ? undefined
                    : chroma.contrast(instrumentColor, 'white') > 2
                        ? 'white'
                        : 'black',
                left,
                top,
                width,
            }}
            onClick={() => setCurrentTick(step)}
            onContextMenu={() => removeNote(step)}
        >
            { /* width > PIANO_ROLL_NOTE_WIDTH && */
                Object.keys(NOTES)[note]
            }
            {channelId === currentChannelId &&
                <StyledPianoRollPlacedNoteDragHandle />
            }
        </StyledPianoRollPlacedNote>
    );
}
