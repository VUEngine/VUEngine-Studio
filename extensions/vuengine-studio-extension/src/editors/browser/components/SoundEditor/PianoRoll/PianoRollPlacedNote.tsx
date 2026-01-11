import chroma from 'chroma-js';
import React, { Dispatch, SetStateAction, SyntheticEvent, useMemo, useRef, useState } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import styled from 'styled-components';
import { getMaxNoteDuration } from '../Other/Note';
import { getNoteSlideLabel, SetNoteEventProps } from '../SoundEditor';
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

const MAX_FONT_SIZE = 13;

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

    box-sizing: border-box;
    color: #fff;
    cursor: move;
    outline: 0 solid var(--theia-focusBorder);
    position: absolute;
    text-align: center;
    user-select: none;
    z-index: 100;

    &:hover {
        border-radius: 1px;
        outline-width: 1px;
        z-index: 11;
    }

    &.selected {
        animation: outlineActivate .3s linear;
        border-radius: 1px;
        outline-width: 3px;
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

const StyledPianoRollPlacedNoteLabel = styled.div`
    margin: 0 6px 0 2px;
    overflow: hidden;
`;

interface PianoRollPlacedNoteProps {
    currentSequenceIndex: number
    selected: boolean
    setNoteCursor: (playRangeEnd: number) => void
    noteLabel: string
    duration: number
    step: number
    instrumentColor: string
    setNotes: (notes: EventsMap) => void
    setNoteEvent: (notes: SetNoteEventProps[]) => void
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
}

export default function PianoRollPlacedNote(props: PianoRollPlacedNoteProps): React.JSX.Element {
    const {
        currentSequenceIndex,
        selected,
        setNoteCursor,
        noteLabel,
        duration,
        step,
        instrumentColor,
        setNotes,
        setNoteEvent,
        pattern,
        noteSnapping,
        pianoRollNoteHeight, pianoRollNoteWidth,
        setCurrentInstrumentId,
        selectedNotes, setSelectedNotes,
        isSelected,
        noteDragDelta, setNoteDragDelta,
    } = props;
    const [isDragging, setIsDragging] = useState(false);
    const nodeRef = useRef(null);

    const events = pattern.events;
    const patternSize = pattern.size;
    const noteId = NOTES_LABELS.indexOf(noteLabel);
    const localStep = step - (currentSequenceIndex * BAR_NOTE_RESOLUTION / SEQUENCER_RESOLUTION);

    const left = PIANO_ROLL_KEY_WIDTH + 2 + step * pianoRollNoteWidth / SUB_NOTE_RESOLUTION;
    const top = PIANO_ROLL_GRID_METER_HEIGHT + PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT + noteId * pianoRollNoteHeight;
    const width = duration * (pianoRollNoteWidth / SUB_NOTE_RESOLUTION) - PIANO_ROLL_GRID_WIDTH;

    const classNames = ['placedNote'];
    if (selected) {
        classNames.push('selected');
    }

    const fontSize = pianoRollNoteHeight - PIANO_ROLL_GRID_WIDTH - 2;

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

    const minWidth = noteSnapping ? pianoRollNoteWidth : 1;
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

    const onResize = (event: SyntheticEvent, data: ResizeCallbackData) => {
        const newDuration = noteSnapping
            ? Math.ceil(data.size.width / pianoRollNoteWidth) * SUB_NOTE_RESOLUTION
            : Math.ceil(data.size.width * SUB_NOTE_RESOLUTION / pianoRollNoteWidth);
        if (newDuration === duration) {
            return;
        }
        setNoteEvent([{
            step: localStep,
            event: SoundEvent.Duration,
            value: newDuration
        }]);
    };

    const onNoteSlideUpResize = (event: SyntheticEvent, data: ResizeCallbackData) => {
        const slideStep = Math.ceil(data.size.height / pianoRollNoteHeight);
        setNoteEvent([{
            step: localStep,
            event: SoundEvent.NoteSlide,
            value: slideStep !== 0 ? slideStep : undefined
        }]);
    };

    const onNoteSlideDownResize = (event: SyntheticEvent, data: ResizeCallbackData) => {
        const slideStep = -1 * Math.ceil(data.size.height / pianoRollNoteHeight);
        setNoteEvent([{
            step: localStep,
            event: SoundEvent.NoteSlide,
            value: slideStep !== 0 ? slideStep : undefined
        }]);
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
        const newStep = (noteSnapping
            ? Math.ceil(((data.x - PIANO_ROLL_KEY_WIDTH - 2) / pianoRollNoteWidth)) * SUB_NOTE_RESOLUTION
            : Math.ceil(((data.x - PIANO_ROLL_KEY_WIDTH - 2) * SUB_NOTE_RESOLUTION / pianoRollNoteWidth))
        ) - currentSequenceIndex * BAR_NOTE_RESOLUTION / SEQUENCER_RESOLUTION;
        const newNoteId = Math.floor((data.y - PIANO_ROLL_GRID_METER_HEIGHT - PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT) / pianoRollNoteHeight);

        const newStepDifference = newStep - localStep;
        const newNoteDifference = newNoteId - noteId;

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

        setSelectedNotes(Object.values(notes).filter(n => n.step !== undefined).map(n => n.step));
        setNoteDragDelta({ x: 0, y: 0 });
        setIsDragging(false);

        e.stopPropagation();
    };

    const onMouseDown = (e: MouseEvent) => {
        if (e.button === 0) {
            if (e.shiftKey) {
                setSelectedNotes(prev =>
                    [...prev, step]
                        .filter((item, pos, self) => self.indexOf(item) === pos) // remove double
                        .sort()
                );
            } else {
                const stepEvent = events[localStep];
                if (stepEvent) {
                    const instrumentId = stepEvent[SoundEvent.Instrument];
                    setCurrentInstrumentId(instrumentId ?? TRACK_DEFAULT_INSTRUMENT_ID);
                }
                if (!selectedNotes.includes(localStep)) {
                    setNoteCursor(step);
                }
            }
        } else if (e.button === 2) {
            setNotes({ [localStep]: {} });
        }

        e.stopPropagation();
    };

    return (
        <Draggable
            nodeRef={nodeRef}
            grid={[minWidth, pianoRollNoteHeight]}
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
                className={classNames.join(' ')}
                style={{
                    backgroundColor: instrumentColor,
                    color: chroma.contrast(instrumentColor, 'white') > 2 ? 'white' : 'black',
                    fontSize: Math.min(fontSize, MAX_FONT_SIZE),
                    lineHeight: `${pianoRollNoteHeight - PIANO_ROLL_GRID_WIDTH}px`,
                    height: pianoRollNoteHeight - PIANO_ROLL_GRID_WIDTH,
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
                        <StyledPianoRollPlacedNoteLabel>
                            {label}
                        </StyledPianoRollPlacedNoteLabel>
                    </>
                </ResizableBox>
            </StyledPianoRollPlacedNote>
        </Draggable>
    );
}
