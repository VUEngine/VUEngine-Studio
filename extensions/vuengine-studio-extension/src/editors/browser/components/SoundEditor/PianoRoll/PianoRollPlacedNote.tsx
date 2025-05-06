import chroma from 'chroma-js';
import React, { SyntheticEvent, useMemo } from 'react';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import { getMaxNoteDuration } from '../Sidebar/Note';
import { EventsMap, NOTE_RESOLUTION, NOTES, PIANO_ROLL_NOTE_HEIGHT, PIANO_ROLL_NOTE_WIDTH } from '../SoundEditorTypes';
import { StyledPianoRollPlacedNote } from './StyledComponents';

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
    setNote: (step: number, note?: number, duration?: number) => void
    events: EventsMap
    patternSize: number
}

export default function PianoRollPlacedNote(props: PianoRollPlacedNoteProps): React.JSX.Element {
    const {
        channelId, currentChannelId,
        currentTick, setCurrentTick,
        note, duration,
        step,
        instrumentColor,
        setNote,
        events,
        patternSize,
    } = props;

    const left = getLeftOffset(step);
    const lastNoteLeft = getLeftOffset(step + duration - 1);
    const top = getTopOffset(note);
    const width = lastNoteLeft - left + PIANO_ROLL_NOTE_WIDTH;

    const maxDuration = useMemo(() =>
        getMaxNoteDuration(events, step, patternSize),
        [events, step, patternSize]);

    const onResizeStop = (event: SyntheticEvent, data: ResizeCallbackData) => {
        console.log('data.size', data.size);
        const newDuration = Math.floor(data.size.width / PIANO_ROLL_NOTE_WIDTH);
        setNote(step, note, newDuration);
    };

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
            }}
            onClick={() => setCurrentTick(step)}
            onContextMenu={() => setNote(step)}
        >
            <ResizableBox
                width={width}
                height={PIANO_ROLL_NOTE_HEIGHT}
                draggableOpts={{
                    grid: [(PIANO_ROLL_NOTE_WIDTH + 1), PIANO_ROLL_NOTE_HEIGHT]
                }}
                axis="x"
                minConstraints={[(PIANO_ROLL_NOTE_WIDTH + 1), PIANO_ROLL_NOTE_HEIGHT]}
                maxConstraints={[(PIANO_ROLL_NOTE_WIDTH + 1) * maxDuration, PIANO_ROLL_NOTE_HEIGHT]}
                resizeHandles={channelId === currentChannelId ? ['e'] : []}
                onResizeStop={onResizeStop}
            >
                <>
                    { /* width > PIANO_ROLL_NOTE_WIDTH && */
                        Object.keys(NOTES)[note]
                    }
                </>
            </ResizableBox>
        </StyledPianoRollPlacedNote>
    );
}
