import chroma from 'chroma-js';
import React, { SyntheticEvent, useMemo } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import { getMaxNoteDuration } from '../Sidebar/Note';
import { EventsMap, NOTE_RESOLUTION, NOTES, NOTES_SPECTRUM, PIANO_ROLL_NOTE_HEIGHT, PIANO_ROLL_NOTE_WIDTH } from '../SoundEditorTypes';
import { StyledPianoRollPlacedNote } from './StyledComponents';

const PIANO_WIDTH = 51;
const getLeftOffset = (index: number) => PIANO_WIDTH + (index * PIANO_ROLL_NOTE_WIDTH);
const getTopOffset = (note: number) => note * PIANO_ROLL_NOTE_HEIGHT;

interface PianoRollPlacedNoteProps {
    currentChannelId: number
    channelId: number
    currentTick: number
    setCurrentTick: (playRangeEnd: number) => void
    note: number
    duration: number
    step: number
    instrumentColor: string
    setNote: (step: number, note?: number, duration?: number, prevStep?: number) => void
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
    const top = getTopOffset(note);
    const width = duration * PIANO_ROLL_NOTE_WIDTH - 1;

    const classNames = ['placedNote'];
    if (channelId !== currentChannelId) {
        classNames.push('oc');
    } else if (currentTick === step) {
        classNames.push('selected');
    }

    const maxDuration = useMemo(() =>
        getMaxNoteDuration(events, step, patternSize),
        [events, step, patternSize]);

    const onResize = (event: SyntheticEvent, data: ResizeCallbackData) => {
        const newDuration = Math.floor(data.size.width / PIANO_ROLL_NOTE_WIDTH);
        setNote(step, note, newDuration);
    };

    const onStop = (e: DraggableEvent, data: DraggableData) => {
        const newStep = Math.ceil((data.x - PIANO_WIDTH) / PIANO_ROLL_NOTE_WIDTH);
        const newNoteId = Math.floor(data.y / PIANO_ROLL_NOTE_HEIGHT);
        setNote(newStep, newNoteId, duration, step);
    };

    return (
        <Draggable
            grid={[PIANO_ROLL_NOTE_WIDTH, PIANO_ROLL_NOTE_HEIGHT]}
            handle=".placedNote"
            cancel=".react-resizable-handle"
            onStop={onStop}
            position={{
                x: left,
                y: top,
            }}
            bounds={{
                bottom: (NOTES_SPECTRUM - 1) * PIANO_ROLL_NOTE_HEIGHT,
                left: PIANO_WIDTH,
                right: PIANO_WIDTH + (patternSize * NOTE_RESOLUTION - duration) * PIANO_ROLL_NOTE_WIDTH,
                top: 0,
            }}
        >
            <StyledPianoRollPlacedNote
                className={classNames.join(' ')}
                style={{
                    backgroundColor: channelId !== currentChannelId
                        ? undefined
                        : instrumentColor,
                    color: channelId !== currentChannelId
                        ? undefined
                        : chroma.contrast(instrumentColor, 'white') > 2
                            ? 'white'
                            : 'black',
                }}
                onClick={() => setCurrentTick(step)}
                onContextMenu={() => setNote(step)}
            >
                <ResizableBox
                    width={width}
                    height={PIANO_ROLL_NOTE_HEIGHT}
                    draggableOpts={{
                        grid: [PIANO_ROLL_NOTE_WIDTH, PIANO_ROLL_NOTE_HEIGHT]
                    }}
                    axis="x"
                    minConstraints={[PIANO_ROLL_NOTE_WIDTH, PIANO_ROLL_NOTE_HEIGHT]}
                    maxConstraints={[PIANO_ROLL_NOTE_WIDTH * maxDuration, PIANO_ROLL_NOTE_HEIGHT]}
                    resizeHandles={channelId === currentChannelId ? ['e'] : []}
                    onResize={onResize}
                >
                    <>
                        { /* width > PIANO_ROLL_NOTE_WIDTH && */
                            Object.keys(NOTES)[note]
                        }
                    </>
                </ResizableBox>
            </StyledPianoRollPlacedNote>
        </Draggable >
    );
}
