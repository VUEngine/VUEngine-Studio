import chroma from 'chroma-js';
import React, { Dispatch, SetStateAction, SyntheticEvent, useMemo, useRef, useState } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import styled from 'styled-components';
import { getMaxNoteDuration } from '../Other/Note';
import { getNoteSlideLabel } from '../SoundEditor';
import {
    BAR_NOTE_RESOLUTION,
    EventsMap,
    NOTE_RESOLUTION,
    NOTES_LABELS,
    NOTES_SPECTRUM,
    PatternConfig,
    PIANO_ROLL_GRID_METER_HEIGHT,
    PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT,
    PIANO_ROLL_GRID_WIDTH,
    PIANO_ROLL_KEY_WIDTH,
    SEQUENCER_RESOLUTION,
    SoundEvent,
    SUB_NOTE_RESOLUTION,
    TRACK_DEFAULT_INSTRUMENT_ID
} from '../SoundEditorTypes';

const StyledPianoRollPlacedNote = styled.div`
    @keyframes outlineActivate {
        0%  { outline-width: 0; }
        11% { outline-width: 1px; }
        22% { outline-width: 2px; }
        33% { outline-width: 3px; }
        44% { outline-width: 4px; }
        55% { outline-width: 5px; }
        66% { outline-width: 6px; }
        77% { outline-width: 5px; }
        88% { outline-width: 4px; }
        99% { outline-width: 3px; }
    }

    animation: outlineActivate .3s linear;
    box-sizing: border-box;
    color: #fff;
    cursor: move;
    opacity: 0;
    outline: 1px solid;
    outline-offset: -1px;
    position: absolute;
    text-align: center;
    user-select: none;
    z-index: 100;

    &:hover {
        opacity: 1;
    }

    .react-resizable-handle-e {
        border-left: 1px solid;
        bottom: 0;
        cursor: col-resize;
        opacity: .7;
        position: absolute;
        right: 0;
        top: 0;
        width: 4px;
    }
    
    &.react-draggable-dragging {
        .react-resizable-handle {
            display: none;
        } 
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
    setNoteCursor: (playRangeEnd: number) => void
    noteLabel: string
    duration: number
    step: number
    instrumentColor: string
    setNotes: (notes: EventsMap) => void
    pattern: PatternConfig
    noteSnapping: boolean
    pianoRollNoteHeight: number
    pianoRollNoteWidth: number
    setCurrentInstrumentId: Dispatch<SetStateAction<string>>
    selectedNotes: number[]
    setSelectedNotes: Dispatch<SetStateAction<number[]>>
    isSelected: boolean
    noteDragDelta: { x: number, y: number }
    setNoteDragDelta: Dispatch<SetStateAction<{ x: number, y: number }>>
    newNoteDuration: number
}

export default function PianoRollPlacedNote(props: PianoRollPlacedNoteProps): React.JSX.Element {
    const {
        currentSequenceIndex,
        setNoteCursor,
        noteLabel,
        duration,
        step,
        instrumentColor,
        setNotes,
        pattern,
        noteSnapping,
        pianoRollNoteHeight, pianoRollNoteWidth,
        setCurrentInstrumentId,
        selectedNotes, setSelectedNotes,
        isSelected,
        noteDragDelta, setNoteDragDelta,
        newNoteDuration,
    } = props;
    const [isDragging, setIsDragging] = useState(false);
    const nodeRef = useRef(null);

    const events = pattern.events;
    const patternSize = pattern.size;
    const noteId = NOTES_LABELS.indexOf(noteLabel);
    const localStep = step - (currentSequenceIndex * BAR_NOTE_RESOLUTION / SEQUENCER_RESOLUTION);

    const left = PIANO_ROLL_KEY_WIDTH + 2 + step * pianoRollNoteWidth / SUB_NOTE_RESOLUTION;
    const top = PIANO_ROLL_GRID_METER_HEIGHT + PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT + noteId * pianoRollNoteHeight;
    const width = Math.max(
        duration * (pianoRollNoteWidth / SUB_NOTE_RESOLUTION) - PIANO_ROLL_GRID_WIDTH,
        1
    );

    const maxDuration = useMemo(() =>
        getMaxNoteDuration(events, localStep, patternSize),
        [events, step, currentSequenceIndex, patternSize]
    );

    const topDragBound = useMemo(() => {
        const topPianoRollBound = PIANO_ROLL_GRID_METER_HEIGHT + pianoRollNoteHeight + 2;

        let topMostNoteDifference = 0;
        const topMostNote = selectedNotes
            .map(sn => NOTES_LABELS.indexOf(events[sn] !== undefined ? events[sn][SoundEvent.Note] : noteId))
            .filter(snId => snId < noteId)
            .sort()[0];
        if (topMostNote !== undefined) {
            topMostNoteDifference = (noteId - topMostNote) * pianoRollNoteHeight;
        }

        return topPianoRollBound + topMostNoteDifference;
    },
        [
            pianoRollNoteHeight,
            selectedNotes,
            events,
            noteId
        ]
    );

    const rightDragBound = useMemo(() => {
        const rightPatternBound = (currentSequenceIndex + patternSize + 1) * NOTE_RESOLUTION * pianoRollNoteWidth / SEQUENCER_RESOLUTION;
        let rightMostNoteDuration = duration;

        let rightMostNoteDifference = 0;
        const rightMostNote = selectedNotes.filter(sn => sn > localStep).sort().pop();
        if (rightMostNote !== undefined) {
            rightMostNoteDifference = (rightMostNote - localStep) / SUB_NOTE_RESOLUTION * pianoRollNoteWidth;
            if (events[rightMostNote] !== undefined && events[rightMostNote][SoundEvent.Duration] !== undefined) {
                rightMostNoteDuration = events[rightMostNote][SoundEvent.Duration];
            } else {
                rightMostNoteDuration = 1;
            }
        }

        const rightMostNoteWidth = (rightMostNoteDuration / SUB_NOTE_RESOLUTION * pianoRollNoteWidth);

        return rightPatternBound - rightMostNoteDifference - rightMostNoteWidth;
    },
        [
            currentSequenceIndex,
            duration,
            patternSize,
            pianoRollNoteWidth,
            selectedNotes,
            localStep,
            events
        ]
    );

    const bottomDragBound = useMemo(() => {
        const bottomPianoRollBound = NOTES_SPECTRUM * pianoRollNoteHeight + PIANO_ROLL_GRID_METER_HEIGHT + 2;

        let bottomMostNoteDifference = 0;
        const bottomMostNote = selectedNotes
            .map(sn => NOTES_LABELS.indexOf(events[sn] !== undefined ? events[sn][SoundEvent.Note] : noteId))
            .filter(snId => snId > noteId)
            .sort().pop();
        if (bottomMostNote !== undefined) {
            bottomMostNoteDifference = (bottomMostNote - noteId) * pianoRollNoteHeight;
        }

        return bottomPianoRollBound - bottomMostNoteDifference;
    },
        [
            pianoRollNoteHeight,
            selectedNotes,
            events,
            noteId
        ]
    );

    const leftDragBound = useMemo(() => {
        const leftPatternBound = PIANO_ROLL_KEY_WIDTH + 2 + currentSequenceIndex * NOTE_RESOLUTION * pianoRollNoteWidth / SEQUENCER_RESOLUTION;

        let leftMostNoteDifference = 0;
        const leftMostNote = selectedNotes.filter(sn => sn < localStep).sort()[0];
        if (leftMostNote !== undefined) {
            leftMostNoteDifference = (localStep - leftMostNote) / SUB_NOTE_RESOLUTION * pianoRollNoteWidth;
        }

        return leftPatternBound + leftMostNoteDifference;
    },
        [
            currentSequenceIndex,
            pianoRollNoteWidth,
            selectedNotes,
            localStep
        ]
    );

    const gridWidth = noteSnapping
        ? pianoRollNoteWidth * newNoteDuration / SUB_NOTE_RESOLUTION
        : 1;
    const maxWidth = pianoRollNoteWidth * maxDuration / SUB_NOTE_RESOLUTION;

    const getNoteSlide = () => {
        const event = events[localStep];
        if (event) {
            return event[SoundEvent.NoteSlide] ?? 0;
        }

        return 0;
    };

    const label = useMemo(() => {
        let l = noteLabel;
        const slide = getNoteSlide();
        if (slide) {
            l += getNoteSlideLabel(events[localStep][SoundEvent.Note], slide);
        }
        return l;
    }, [events]);

    const slideUpHeight = useMemo(() => {
        const slide = getNoteSlide();
        return slide > 0 ? slide * pianoRollNoteHeight : 0;
    }, [events]);

    const slideDownHeight = useMemo(() => {
        const slide = getNoteSlide();
        return slide < 0 ? Math.abs(slide) * pianoRollNoteHeight : 0;
    }, [events]);

    const setNoteSlide = (height: number) => {
        const slideStep = Math.ceil(height / pianoRollNoteHeight);
        const slideStepToApply = slideStep !== 0 ? slideStep : undefined;
        const notes: EventsMap = {};
        selectedNotes.forEach(sn => {
            notes[sn] = {
                [SoundEvent.NoteSlide]: slideStepToApply,
            };
        });
        setNotes(notes);
    };

    const onResize = (event: SyntheticEvent, data: ResizeCallbackData) => {
        const newDuration = noteSnapping
            ? Math.ceil(data.size.width / pianoRollNoteWidth) * SUB_NOTE_RESOLUTION
            : Math.ceil(data.size.width * SUB_NOTE_RESOLUTION / pianoRollNoteWidth);
        if (newDuration === duration) {
            return;
        }

        const durationDelta = newDuration - duration;
        const notes: EventsMap = {};
        selectedNotes.forEach(sn => {
            const adjustedDuration = events[sn][SoundEvent.Duration]
                ? noteSnapping
                    ? Math.max(SUB_NOTE_RESOLUTION, events[sn][SoundEvent.Duration] + durationDelta)
                    : Math.max(1, events[sn][SoundEvent.Duration] + durationDelta)
                : newDuration;
            notes[sn] = {
                [SoundEvent.Duration]: adjustedDuration,
            };
        });
        setNotes(notes);
    };

    const onNoteSlideUpResize = (event: SyntheticEvent, data: ResizeCallbackData) => {
        setNoteSlide(data.size.height);
    };

    const onNoteSlideDownResize = (event: SyntheticEvent, data: ResizeCallbackData) => {
        setNoteSlide(-1 * data.size.height);
    };

    const onDrag = (e: DraggableEvent, data: DraggableData) => {
        setNoteDragDelta(prev => ({
            x: prev.x + data.deltaX,
            y: prev.y + data.deltaY
        }));

        e.stopPropagation();
    };

    const onDragStart = (e: DraggableEvent, data: DraggableData) => {
        setIsDragging(true);
    };

    const onDragStop = (e: DraggableEvent, data: DraggableData) => {
        e.stopPropagation();
        setNoteDragDelta({ x: 0, y: 0 });
        setIsDragging(false);

        const newStep = (noteSnapping
            ? Math.ceil(((data.x - PIANO_ROLL_KEY_WIDTH - 2) / pianoRollNoteWidth)) * SUB_NOTE_RESOLUTION
            : Math.ceil(((data.x - PIANO_ROLL_KEY_WIDTH - 2) * SUB_NOTE_RESOLUTION / pianoRollNoteWidth))
        ) - currentSequenceIndex * BAR_NOTE_RESOLUTION / SEQUENCER_RESOLUTION;
        const newNoteId = Math.floor((data.y - PIANO_ROLL_GRID_METER_HEIGHT - PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT) / pianoRollNoteHeight);

        const newStepDifference = newStep - localStep;
        const newNoteDifference = newNoteId - noteId;

        if (newStepDifference === 0 && newNoteDifference === 0) {
            return;
        }

        const notes: EventsMap = {};

        // add previous notes to delete
        notes[localStep] = {};
        selectedNotes.forEach(sn => {
            if (sn !== localStep && events[sn] !== undefined && events[sn][SoundEvent.Note] !== undefined) {
                notes[sn] = {};
            }
        });

        // add notes to set
        notes[newStep] = {
            ...events[localStep],
            [SoundEvent.Note]: NOTES_LABELS[newNoteId],
        };
        selectedNotes.forEach(sn => {
            if (sn !== localStep && events[sn] !== undefined && events[sn][SoundEvent.Note] !== undefined) {
                const snNoteId = NOTES_LABELS.indexOf(events[sn][SoundEvent.Note]);
                notes[sn + newStepDifference] = {
                    ...events[sn],
                    [SoundEvent.Note]: NOTES_LABELS[snNoteId + newNoteDifference],
                };
            }
        });

        setNotes(notes);
        setSelectedNotes(Object.keys(notes).map(n => parseInt(n)));
    };

    const onMouseDown = (e: MouseEvent) => {
        if (e.button === 0) {
            if (e.metaKey || e.ctrlKey) {
                if (selectedNotes.includes(step)) {
                    setSelectedNotes(prev => prev.filter(sn => sn !== step).sort());
                } else {
                    setSelectedNotes(prev => [...prev, step].sort());
                }
            } else {
                const stepEvent = events[localStep];
                if (stepEvent) {
                    const instrumentId = stepEvent[SoundEvent.Instrument];
                    setCurrentInstrumentId(instrumentId ?? TRACK_DEFAULT_INSTRUMENT_ID);
                }
                if (!selectedNotes.includes(localStep)) {
                    setSelectedNotes([localStep]);
                }
                setNoteCursor(step);
            }
        } else if ((e.button === 2)) {
            if ((e.metaKey || e.ctrlKey || e.altKey)) {
                setNotes({ [localStep]: {} });
            }
        }

        e.stopPropagation();
    };

    return (
        <Draggable
            nodeRef={nodeRef}
            grid={[gridWidth, pianoRollNoteHeight]}
            handle=".placedNote"
            cancel=".react-resizable-handle"
            onStart={onDragStart}
            onDrag={onDrag}
            onStop={onDragStop}
            onMouseDown={onMouseDown}
            position={{
                x: left,
                y: top,
            }}
            bounds={{
                bottom: bottomDragBound,
                left: leftDragBound,
                right: rightDragBound,
                top: topDragBound,
            }}
        >
            <StyledPianoRollPlacedNote
                ref={nodeRef}
                className='placedNote'
                style={{
                    borderColor: instrumentColor,
                    color: chroma.contrast(instrumentColor, 'white') > 2 ? 'white' : 'black',
                    height: pianoRollNoteHeight - PIANO_ROLL_GRID_WIDTH,
                    outlineColor: instrumentColor,
                    translate: !isDragging && isSelected
                        ? `${noteDragDelta.x}px ${noteDragDelta.y}px`
                        : undefined
                }}
                title={label}
            >
                <ResizableBox
                    width={width}
                    height={pianoRollNoteHeight}
                    draggableOpts={{
                        grid: [gridWidth, pianoRollNoteHeight]
                    }}
                    axis="x"
                    minConstraints={[gridWidth, pianoRollNoteHeight]}
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
                                grid: [gridWidth, pianoRollNoteHeight]
                            }}
                            axis="y"
                            minConstraints={[gridWidth, 0]}
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
                                grid: [gridWidth, pianoRollNoteHeight]
                            }}
                            axis="y"
                            minConstraints={[gridWidth, 0]}
                            maxConstraints={[maxWidth, pianoRollNoteHeight * NOTES_SPECTRUM]}
                            resizeHandles={['s']}
                            onResizeStop={onNoteSlideDownResize}
                        />
                    </>
                </ResizableBox>
            </StyledPianoRollPlacedNote>
        </Draggable>
    );
}
