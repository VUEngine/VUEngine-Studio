import { deepClone } from '@theia/core';
import chroma from 'chroma-js';
import React, { Dispatch, SetStateAction, SyntheticEvent, useMemo, useRef, useState } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import styled from 'styled-components';
import { getMaxNoteDuration } from '../Other/Note';
import { getNoteSlideLabel } from '../SoundEditor';
import {
    EventsMap,
    NOTES_LABELS,
    NOTES_SPECTRUM,
    PatternConfig,
    PIANO_ROLL_GRID_METER_HEIGHT,
    PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT,
    PIANO_ROLL_GRID_WIDTH,
    PIANO_ROLL_KEY_WIDTH,
    SoundEditorTool,
    SoundEvent,
    SUB_NOTE_RESOLUTION,
    TRACK_DEFAULT_INSTRUMENT_ID
} from '../SoundEditorTypes';

const StyledPianoRollPlacedNote = styled.div`
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

    &:hover,
    &.resizing,
    &.react-draggable-dragging:not(.cancelNoteDrag) {
        opacity: 1;
    }

    .react-resizable-handle-e {
        border-left: 1px solid;
        bottom: 1px;
        cursor: col-resize;
        opacity: .7;
        position: absolute;
        right: 0;
        top: 1px;
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
    tool: SoundEditorTool
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
    setSelectedNotes: (sn: number[]) => void
    cancelNoteDrag: boolean
    setCancelNoteDrag: Dispatch<SetStateAction<boolean>>
    isSelected: boolean
    noteDragDelta: { x: number, y: number }
    setNoteDragDelta: Dispatch<SetStateAction<{ x: number, y: number }>>
    newNoteDuration: number
    setNoteDialogOpen: Dispatch<SetStateAction<boolean>>
}

export default function PianoRollPlacedNote(props: PianoRollPlacedNoteProps): React.JSX.Element {
    const {
        tool,
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
        cancelNoteDrag, setCancelNoteDrag,
        isSelected,
        noteDragDelta, setNoteDragDelta,
        newNoteDuration,
        setNoteDialogOpen,
    } = props;
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const [xOffsetFromGrid, setXOffsetFromGrid] = useState<number>(0);
    const nodeRef = useRef(null);

    const noteId = NOTES_LABELS.indexOf(noteLabel);
    const currentSequenceIndexStartStep = currentSequenceIndex * SUB_NOTE_RESOLUTION;
    const relativeStep = step - currentSequenceIndexStartStep;

    const classNames = ['placedNote'];
    if (isResizing) {
        classNames.push('resizing');
    }
    if (cancelNoteDrag) {
        classNames.push('cancelNoteDrag');
    }

    const left = step * pianoRollNoteWidth / SUB_NOTE_RESOLUTION;
    const top = PIANO_ROLL_GRID_METER_HEIGHT + PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT + noteId * pianoRollNoteHeight;
    const width = Math.max(
        duration * (pianoRollNoteWidth / SUB_NOTE_RESOLUTION) - PIANO_ROLL_GRID_WIDTH,
        1
    );

    const topDragBound = useMemo(() => {
        const topPianoRollBound = PIANO_ROLL_GRID_METER_HEIGHT + pianoRollNoteHeight + 2;

        let topMostNoteDifference = 0;
        const smallerNotes = selectedNotes
            .filter(sn => pattern.events[sn] !== undefined)
            .map(sn => NOTES_LABELS.indexOf(pattern.events[sn][SoundEvent.Note]))
            .filter(snId => snId < noteId);
        if (smallerNotes.length) {
            const topMostNote = Math.min(...smallerNotes);
            topMostNoteDifference = (noteId - topMostNote) * pianoRollNoteHeight;
        }

        return topPianoRollBound + topMostNoteDifference;
    }, [
        selectedNotes,
        pianoRollNoteHeight,
        pattern.events,
        noteId
    ]);

    const rightDragBound = useMemo(() => {
        const rightPatternBound = PIANO_ROLL_KEY_WIDTH + (currentSequenceIndex + pattern.size) * pianoRollNoteWidth;
        let rightMostNoteDuration = duration;

        let rightMostNoteDifference = 0;
        const largerNotes = selectedNotes
            .filter(sn => pattern.events[sn] !== undefined && sn > relativeStep);
        if (largerNotes.length) {
            const rightMostNote = Math.max(...largerNotes);
            rightMostNoteDifference = (rightMostNote - relativeStep) / SUB_NOTE_RESOLUTION * pianoRollNoteWidth;
            if (pattern.events[rightMostNote] !== undefined && pattern.events[rightMostNote][SoundEvent.Duration] !== undefined) {
                rightMostNoteDuration = pattern.events[rightMostNote][SoundEvent.Duration];
            }
        }

        const rightMostNoteWidth = (rightMostNoteDuration / SUB_NOTE_RESOLUTION * pianoRollNoteWidth);

        return rightPatternBound - rightMostNoteDifference - rightMostNoteWidth + 2;
    }, [
        currentSequenceIndex,
        pattern.events,
        pattern.size,
        pianoRollNoteWidth,
        duration,
        relativeStep,
        selectedNotes,
    ]);

    const bottomDragBound = useMemo(() => {
        const bottomPianoRollBound = NOTES_SPECTRUM * pianoRollNoteHeight + PIANO_ROLL_GRID_METER_HEIGHT + 2;

        let bottomMostNoteDifference = 0;
        const largerNotes = selectedNotes
            .map(sn => pattern.events[sn] !== undefined ? NOTES_LABELS.indexOf(pattern.events[sn][SoundEvent.Note]) : noteId)
            .filter(snId => snId > noteId);
        if (largerNotes.length) {
            const bottomMostNote = Math.max(...largerNotes);
            bottomMostNoteDifference = (bottomMostNote - noteId) * pianoRollNoteHeight;
        }

        return bottomPianoRollBound - bottomMostNoteDifference;
    }, [
        selectedNotes,
        pianoRollNoteHeight,
        pattern.events,
        noteId
    ]);

    const leftDragBound = useMemo(() => {
        const leftPatternBound = PIANO_ROLL_KEY_WIDTH + 2 + currentSequenceIndex * pianoRollNoteWidth;

        let leftMostNoteDifference = 0;
        const smallerNotes = selectedNotes
            .filter(sn => pattern.events[sn] !== undefined && sn < relativeStep);
        if (smallerNotes.length) {
            const leftMostNote = Math.min(...smallerNotes);
            leftMostNoteDifference = (relativeStep - leftMostNote) / SUB_NOTE_RESOLUTION * pianoRollNoteWidth;
        }

        return leftPatternBound + leftMostNoteDifference;
    }, [
        currentSequenceIndex,
        pianoRollNoteWidth,
        pattern.events,
        relativeStep,
        selectedNotes,
    ]);

    const gridWidth = noteSnapping
        ? pianoRollNoteWidth * newNoteDuration
        : 1;
    const maxWidth = pianoRollNoteWidth * getMaxNoteDuration(pattern.events, relativeStep, pattern.size) / SUB_NOTE_RESOLUTION;

    const getNoteSlide = () => {
        const event = pattern.events[relativeStep];
        if (event) {
            return event[SoundEvent.NoteSlide] ?? 0;
        }

        return 0;
    };

    const label = () => {
        let l = noteLabel;
        const slide = getNoteSlide();
        if (slide) {
            l += getNoteSlideLabel(pattern.events[relativeStep][SoundEvent.Note], slide);
        }
        return l;
    };

    const slideUpHeight = () => {
        const slide = getNoteSlide();
        return slide > 0 ? slide * pianoRollNoteHeight : 0;
    };

    const slideDownHeight = () => {
        const slide = getNoteSlide();
        return slide < 0 ? Math.abs(slide) * pianoRollNoteHeight : 0;
    };

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
        setIsResizing(true);
    };

    const onResizeStop = (event: SyntheticEvent, data: ResizeCallbackData) => {
        setIsResizing(false);

        const newDuration = noteSnapping
            ? Math.ceil(data.size.width / pianoRollNoteWidth) * SUB_NOTE_RESOLUTION
            : Math.ceil(data.size.width * SUB_NOTE_RESOLUTION / pianoRollNoteWidth);
        if (newDuration === duration) {
            return;
        }

        const durationDelta = newDuration - duration;
        const notes: EventsMap = {};
        selectedNotes.forEach(sn => {
            const noteEvents = pattern.events[sn];
            if (!noteEvents) {
                return;
            }
            const adjustedDuration = noteEvents[SoundEvent.Duration]
                ? noteSnapping
                    ? Math.max(SUB_NOTE_RESOLUTION, pattern.events[sn][SoundEvent.Duration] + durationDelta)
                    : Math.max(1, pattern.events[sn][SoundEvent.Duration] + durationDelta)
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
        if (noteSnapping) {
            setXOffsetFromGrid(-1 * left % gridWidth);
        }
        setIsDragging(true);
        setCancelNoteDrag(false);
    };

    const onDragStop = (e: DraggableEvent, data: DraggableData) => {
        e.stopPropagation();

        if (noteSnapping) {
            setXOffsetFromGrid(0);
        }
        setNoteDragDelta({ x: 0, y: 0 });
        setIsDragging(false);

        if (cancelNoteDrag) {
            setCancelNoteDrag(false);
            return;
        }

        const newStep = (noteSnapping
            ? Math.ceil(((data.x - PIANO_ROLL_KEY_WIDTH - 2 + xOffsetFromGrid) / pianoRollNoteWidth)) * SUB_NOTE_RESOLUTION
            : Math.ceil(((data.x - PIANO_ROLL_KEY_WIDTH - 2) * SUB_NOTE_RESOLUTION / pianoRollNoteWidth))
        ) - currentSequenceIndexStartStep;
        const newNoteId = Math.floor((data.y - PIANO_ROLL_GRID_METER_HEIGHT - PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT) / pianoRollNoteHeight);

        const newStepDifference = newStep - relativeStep;
        const newNoteDifference = newNoteId - noteId;

        if (newStepDifference === 0 && newNoteDifference === 0) {
            return;
        }

        const notes: EventsMap = {};

        // add previous notes to delete
        notes[relativeStep] = {};
        selectedNotes.forEach(sn => {
            if (sn !== relativeStep && pattern.events[sn] !== undefined && pattern.events[sn][SoundEvent.Note] !== undefined) {
                notes[sn] = {};
            }
        });

        // add notes to set
        notes[newStep] = {
            ...pattern.events[relativeStep],
            [SoundEvent.Note]: NOTES_LABELS[newNoteId],
        };
        selectedNotes.forEach(sn => {
            if (sn !== relativeStep && pattern.events[sn] !== undefined && pattern.events[sn][SoundEvent.Note] !== undefined) {
                const snNoteId = NOTES_LABELS.indexOf(pattern.events[sn][SoundEvent.Note]);
                notes[sn + newStepDifference] = {
                    ...pattern.events[sn],
                    [SoundEvent.Note]: NOTES_LABELS[snNoteId + newNoteDifference],
                };
            }
        });

        setNotes(notes);
        setSelectedNotes(Object.keys(notes).map(n => parseInt(n)));
        setNoteCursor(newStep + currentSequenceIndexStartStep);
    };

    const onMouseDown = (e: MouseEvent) => {
        if (e.button === 0) {
            if (e.metaKey || e.ctrlKey) {
                if (selectedNotes.includes(step)) {
                    setSelectedNotes(selectedNotes.filter(sn => sn !== step).sort());
                } else {
                    setSelectedNotes([...deepClone(selectedNotes), step].sort());
                }
            } else {
                const stepEvent = pattern.events[relativeStep];
                if (stepEvent) {
                    const instrumentId = stepEvent[SoundEvent.Instrument];
                    setCurrentInstrumentId(instrumentId ?? TRACK_DEFAULT_INSTRUMENT_ID);
                }
                if (!selectedNotes.includes(relativeStep)) {
                    setSelectedNotes([relativeStep]);
                }
                setNoteCursor(step);
            }
        } else if ((e.button === 2)) {
            if ((e.metaKey || e.ctrlKey || e.altKey)) {
                setNotes({ [relativeStep]: {} });
            } else if (selectedNotes.includes(step)) {
                setSelectedNotes(selectedNotes.filter(sn => sn !== step).sort());
            } else {
                setSelectedNotes([...deepClone(selectedNotes), step].sort());
            }
        }

        e.stopPropagation();
    };

    const onDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (tool === SoundEditorTool.EDIT) {
            setNoteDialogOpen(true);
        }
    };

    return (
        <Draggable
            nodeRef={nodeRef}
            grid={[gridWidth, pianoRollNoteHeight]}
            handle=".placedNote"
            cancel=".react-resizable-handle"
            positionOffset={{ x: xOffsetFromGrid, y: 0 }}
            onStart={onDragStart}
            onDrag={onDrag}
            onStop={onDragStop}
            onMouseDown={onMouseDown}
            position={{
                x: PIANO_ROLL_KEY_WIDTH + left + 2,
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
                className={classNames.join(' ')}
                style={{
                    borderColor: instrumentColor,
                    color: chroma.contrast(instrumentColor, 'white') > 2 ? 'white' : 'black',
                    height: pianoRollNoteHeight - PIANO_ROLL_GRID_WIDTH,
                    outlineColor: instrumentColor,
                    translate: !isDragging && isSelected
                        ? `${noteDragDelta.x}px ${noteDragDelta.y}px`
                        : undefined
                }}
                title={label()}
                onDoubleClick={onDoubleClick}
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
                    onResize={onResize}
                    onResizeStop={onResizeStop}
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
                            height={slideUpHeight()}
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
                            height={slideDownHeight()}
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
