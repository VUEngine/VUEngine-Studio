import chroma from 'chroma-js';
import React, { Dispatch, SetStateAction, SyntheticEvent, useMemo } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import styled from 'styled-components';
import { getMaxNoteDuration } from '../Other/Note';
import {
    BAR_NOTE_RESOLUTION,
    EventsMap,
    NOTE_RESOLUTION,
    NOTES_LABELS,
    NOTES_SPECTRUM,
    PIANO_ROLL_GRID_METER_HEIGHT,
    PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT,
    PIANO_ROLL_GRID_WIDTH,
    PIANO_ROLL_KEY_WIDTH,
    SEQUENCER_RESOLUTION,
    SoundEvent,
    SUB_NOTE_RESOLUTION,
    TRACK_DEFAULT_INSTRUMENT_ID
} from '../SoundEditorTypes';

const MAX_FONT_SIZE = 13;

const StyledPianoRollPlacedNote = styled.div`
    box-sizing: border-box;
    color: #fff;
    cursor: move;
    overflow: hidden;
    position: absolute;
    text-align: center;
    text-overflow: ellipsis;
    user-select: none;
    z-index: 100;

    &:hover {
        border-radius: 1px;
        outline: 1px solid var(--theia-focusBorder);
        z-index: 11;
    }

    &.selected {
        border-radius: 1px;
        outline: 3px solid var(--theia-focusBorder);
        z-index: 11;
    }

    .react-resizable-handle-e {
        border-left: 1px solid;
        bottom: 0;
        cursor: col-resize;
        opacity: .3;
        position: absolute;
        right: 0;
        top: 0;
        width: 3px;
    }

    .noteSlide {
        left: 0;
        opacity: .5;
        position: absolute;
        width: 100% !important;
        z-index: -1;

        .react-resizable-handle {
            cursor: ns-resize;
            height: 10px;
            left: 0;
            position: absolute;
            right: 0px;

            &.react-resizable-handle-n {
                top: -10px;
            }

            &.react-resizable-handle-s {
                bottom: -10px;
            }
        }
    }
`;

interface PianoRollPlacedNoteProps {
    currentSequenceIndex: number
    noteCursor: number
    setNoteCursor: (playRangeEnd: number) => void
    noteLabel: string
    duration: number
    step: number
    instrumentColor: string
    setNote: (step: number, note?: string, prevStep?: number, duration?: number) => void
    setNoteEvent: (step: number, event: SoundEvent, value?: any) => void
    events: EventsMap
    patternSize: number
    noteSnapping: boolean
    pianoRollNoteHeight: number
    pianoRollNoteWidth: number
    setCurrentInstrumentId: Dispatch<SetStateAction<string>>
}

export default function PianoRollPlacedNote(props: PianoRollPlacedNoteProps): React.JSX.Element {
    const {
        currentSequenceIndex,
        noteCursor, setNoteCursor: setNoteCursor,
        noteLabel,
        duration,
        step,
        instrumentColor,
        setNote,
        setNoteEvent,
        events,
        patternSize,
        noteSnapping,
        pianoRollNoteHeight, pianoRollNoteWidth,
        setCurrentInstrumentId,
    } = props;

    const noteId = NOTES_LABELS.indexOf(noteLabel);
    const localStep = step - currentSequenceIndex * BAR_NOTE_RESOLUTION / SEQUENCER_RESOLUTION;

    const left = PIANO_ROLL_KEY_WIDTH + 2 + step * pianoRollNoteWidth / SUB_NOTE_RESOLUTION;
    const top = PIANO_ROLL_GRID_METER_HEIGHT + PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT + noteId * pianoRollNoteHeight;
    const width = duration * (pianoRollNoteWidth / SUB_NOTE_RESOLUTION) - PIANO_ROLL_GRID_WIDTH;

    const classNames = ['placedNote'];
    if (noteCursor === step) {
        classNames.push('selected');
    }

    const fontSize = pianoRollNoteHeight - PIANO_ROLL_GRID_WIDTH - 2;

    const maxDuration = useMemo(() =>
        getMaxNoteDuration(events, localStep, patternSize),
        [events, step, currentSequenceIndex, patternSize]
    );

    const minWidth = noteSnapping ? pianoRollNoteWidth : 1;
    const maxWidth = pianoRollNoteWidth * maxDuration / SUB_NOTE_RESOLUTION;

    const getNoteSlide = () => {
        const event = events[localStep];
        if (event) {
            const noteSlide = event[SoundEvent.NoteSlide];
            if (noteSlide > 1) {
                return noteSlide * pianoRollNoteHeight;
            }
        }

        return 0;
    };

    const slideUpHeight = useMemo(() =>
        getNoteSlide()
        , [events]);

    const slideDownHeight = useMemo(() =>
        -1 * getNoteSlide()
        , [events]);

    const onResize = (event: SyntheticEvent, data: ResizeCallbackData) => {
        const newDuration = noteSnapping
            ? Math.ceil(data.size.width / pianoRollNoteWidth) * SUB_NOTE_RESOLUTION
            : Math.ceil(data.size.width * SUB_NOTE_RESOLUTION / pianoRollNoteWidth);
        if (newDuration === duration) {
            return;
        }
        setNoteEvent(localStep, SoundEvent.Duration, newDuration);
    };

    const onNoteSlideUpResize = (event: SyntheticEvent, data: ResizeCallbackData) => {
        const slideStep = Math.ceil(data.size.height / pianoRollNoteHeight);
        setNoteEvent(localStep, SoundEvent.NoteSlide, slideStep !== 0 ? slideStep : undefined);
    };

    const onNoteSlideDownResize = (event: SyntheticEvent, data: ResizeCallbackData) => {
        const slideStep = -1 * Math.ceil(data.size.height / pianoRollNoteHeight);
        setNoteEvent(localStep, SoundEvent.NoteSlide, slideStep !== 0 ? slideStep : undefined);
    };

    const onDragStop = (e: DraggableEvent, data: DraggableData) => {
        const newStep = (noteSnapping
            ? Math.ceil(((data.x - PIANO_ROLL_KEY_WIDTH - 2) / pianoRollNoteWidth)) * SUB_NOTE_RESOLUTION
            : Math.ceil(((data.x - PIANO_ROLL_KEY_WIDTH - 2) * SUB_NOTE_RESOLUTION / pianoRollNoteWidth))
        ) - currentSequenceIndex * BAR_NOTE_RESOLUTION / SEQUENCER_RESOLUTION;
        const newNoteId = Math.floor((data.y - PIANO_ROLL_GRID_METER_HEIGHT - PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT) / pianoRollNoteHeight);
        const newNoteLabel = NOTES_LABELS[newNoteId];
        if (newStep === localStep) {
            return;
        }
        setNote(newStep, newNoteLabel, localStep);
    };

    const onClick = (e: React.MouseEvent<HTMLElement>) => {
        if (e.buttons === 0) {
            const event = events[localStep];
            if (event) {
                const instrumentId = event[SoundEvent.Instrument];
                setCurrentInstrumentId(instrumentId ?? TRACK_DEFAULT_INSTRUMENT_ID);
            }
            setNoteCursor(step);
        } else if (e.buttons === 2) {
            setNote(localStep);
        }
    };

    return (
        <Draggable
            grid={[minWidth, pianoRollNoteHeight]}
            handle=".placedNote"
            cancel=".react-resizable-handle"
            onStop={onDragStop}
            position={{
                x: left,
                y: top,
            }}
            bounds={{
                bottom: (NOTES_SPECTRUM - 1) * pianoRollNoteHeight,
                left: PIANO_ROLL_KEY_WIDTH + 2 + currentSequenceIndex * NOTE_RESOLUTION * pianoRollNoteWidth / SEQUENCER_RESOLUTION,
                right: (currentSequenceIndex + patternSize) * NOTE_RESOLUTION * pianoRollNoteWidth / SEQUENCER_RESOLUTION - (duration / SUB_NOTE_RESOLUTION * pianoRollNoteWidth),
                top: 0,
            }}
        >
            <StyledPianoRollPlacedNote
                className={classNames.join(' ')}
                style={{
                    backgroundColor: instrumentColor,
                    color: chroma.contrast(instrumentColor, 'white') > 2 ? 'white' : 'black',
                    fontSize: Math.min(fontSize, MAX_FONT_SIZE),
                    lineHeight: `${pianoRollNoteHeight - PIANO_ROLL_GRID_WIDTH}px`,
                    height: pianoRollNoteHeight - PIANO_ROLL_GRID_WIDTH,
                }}
                onClick={onClick}
                onContextMenu={onClick}
            >
                <ResizableBox
                    width={width}
                    height={pianoRollNoteHeight}
                    draggableOpts={{
                        grid: [minWidth, pianoRollNoteHeight]
                    }}
                    axis="x"
                    minConstraints={[minWidth, pianoRollNoteHeight]}
                    maxConstraints={[maxWidth, pianoRollNoteHeight]}
                    resizeHandles={['e']}
                    onResizeStop={onResize}
                >
                    <>
                        <ResizableBox
                            className='noteSlide up'
                            style={{
                                background: `linear-gradient(
                                    to bottom right, 
                                    transparent 0%, 
                                    transparent 50%, 
                                    ${instrumentColor} 50%, 
                                    ${instrumentColor} 100%
                                )`,
                                bottom: pianoRollNoteHeight,
                            }}
                            width={width}
                            height={slideUpHeight}
                            draggableOpts={{
                                grid: [minWidth, pianoRollNoteHeight]
                            }}
                            axis="y"
                            minConstraints={[minWidth, 0]}
                            maxConstraints={[maxWidth, pianoRollNoteHeight * NOTES_SPECTRUM]}
                            resizeHandles={['n']}
                            onResizeStop={onNoteSlideUpResize}
                        />
                        <ResizableBox
                            className='noteSlide down'
                            style={{
                                background: `linear-gradient(
                                    to top right, 
                                    transparent 0%, 
                                    transparent 50%, 
                                    ${instrumentColor} 50%, 
                                    ${instrumentColor} 100%
                                )`,
                                top: pianoRollNoteHeight,
                            }}
                            width={width}
                            height={slideDownHeight}
                            draggableOpts={{
                                grid: [minWidth, pianoRollNoteHeight]
                            }}
                            axis="y"
                            minConstraints={[minWidth, 0]}
                            maxConstraints={[maxWidth, pianoRollNoteHeight * NOTES_SPECTRUM]}
                            resizeHandles={['s']}
                            onResizeStop={onNoteSlideDownResize}
                        />
                        {noteLabel}
                    </>
                </ResizableBox>
            </StyledPianoRollPlacedNote>
        </Draggable>
    );
}
