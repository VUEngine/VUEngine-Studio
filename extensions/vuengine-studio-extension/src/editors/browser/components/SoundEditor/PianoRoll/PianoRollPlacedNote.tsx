import chroma from 'chroma-js';
import React, { SyntheticEvent, useMemo } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import styled from 'styled-components';
import { getMaxNoteDuration } from '../Sidebar/Note';
import { EventsMap, NOTE_RESOLUTION, NOTES, NOTES_SPECTRUM, PIANO_ROLL_NOTE_HEIGHT, PIANO_ROLL_NOTE_WIDTH } from '../SoundEditorTypes';

const StyledPianoRollPlacedNote = styled.div`
    border-radius: 1px;
    box-sizing: border-box;
    color: #fff;
    cursor: move;
    font-size: ${PIANO_ROLL_NOTE_HEIGHT - 2}px;
    line-height: ${PIANO_ROLL_NOTE_HEIGHT - 2}px;
    min-height: ${PIANO_ROLL_NOTE_HEIGHT}px;
    max-height: ${PIANO_ROLL_NOTE_HEIGHT}px;
    min-width: ${PIANO_ROLL_NOTE_WIDTH}px;
    outline-offset: 1px;
    overflow: hidden;
    padding-left: 1px;
    position: absolute;
    text-align: center;
    text-overflow: ellipsis;
    z-index: 10;

    &.selected {
        outline: 3px solid var(--theia-focusBorder);
    }

    .react-resizable-handle-e {
        border-left: 1px solid;
        bottom: 2px;
        cursor: col-resize;
        opacity: .5;
        position: absolute;
        right: 0;
        top: 2px;
        width: 2px;
    }
`;

interface PianoRollPlacedNoteProps {
    currentChannelId: number
    channelId: number
    currentSequenceIndex: number
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
        currentSequenceIndex,
        currentTick, setCurrentTick,
        note, duration,
        step,
        instrumentColor,
        setNote,
        events,
        patternSize,
    } = props;
    const localStep = step - currentSequenceIndex * NOTE_RESOLUTION;

    const left = step * PIANO_ROLL_NOTE_WIDTH;
    const top = note * PIANO_ROLL_NOTE_HEIGHT;
    const width = duration * PIANO_ROLL_NOTE_WIDTH - 1;

    const classNames = ['placedNote'];
    if (currentTick === step) {
        classNames.push('selected');
    }

    const maxDuration = useMemo(() =>
        getMaxNoteDuration(events, localStep, patternSize),
        [events, step, currentSequenceIndex, patternSize]
    );

    const onResize = (event: SyntheticEvent, data: ResizeCallbackData) => {
        console.log(data.size.width, Math.ceil(data.size.width / PIANO_ROLL_NOTE_WIDTH));
        const newDuration = Math.ceil(data.size.width / PIANO_ROLL_NOTE_WIDTH);
        setNote(localStep, note, newDuration);
    };

    const onDragStop = (e: DraggableEvent, data: DraggableData) => {
        const newStep = Math.ceil(data.x / PIANO_ROLL_NOTE_WIDTH) - currentSequenceIndex * NOTE_RESOLUTION;
        const newNoteId = Math.floor(data.y / PIANO_ROLL_NOTE_HEIGHT);
        setNote(newStep, newNoteId, duration, localStep);
    };

    const onClick = (e: React.MouseEvent<HTMLElement>) => {
        if (e.buttons === 0) {
            setCurrentTick(step);
        } else if (e.buttons === 2) {
            setNote(localStep);
        }
    };

    return (
        <Draggable
            grid={[PIANO_ROLL_NOTE_WIDTH, PIANO_ROLL_NOTE_HEIGHT]}
            handle=".placedNote"
            cancel=".react-resizable-handle"
            onStop={onDragStop}
            position={{
                x: left,
                y: top,
            }}
            bounds={{
                bottom: (NOTES_SPECTRUM - 1) * PIANO_ROLL_NOTE_HEIGHT,
                left: currentSequenceIndex * NOTE_RESOLUTION * PIANO_ROLL_NOTE_WIDTH,
                right: ((currentSequenceIndex + patternSize) * NOTE_RESOLUTION - duration) * PIANO_ROLL_NOTE_WIDTH,
                top: 0,
            }}
        >
            <StyledPianoRollPlacedNote
                className={classNames.join(' ')}
                style={{
                    backgroundColor: instrumentColor,
                    color: chroma.contrast(instrumentColor, 'white') > 2 ? 'white' : 'black',
                }}
                onClick={onClick}
                onContextMenu={onClick}
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
                    onResizeStop={onResize}
                >
                    <>
                        {width > PIANO_ROLL_NOTE_WIDTH &&
                            Object.keys(NOTES)[note]
                        }
                    </>
                </ResizableBox>
            </StyledPianoRollPlacedNote>
        </Draggable >
    );
}
