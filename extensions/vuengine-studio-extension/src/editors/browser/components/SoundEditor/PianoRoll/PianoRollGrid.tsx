import chroma from 'chroma-js';
import React, { Dispatch, MouseEvent, RefObject, SetStateAction, useContext, useEffect, useRef, useState } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';
import { scaleCanvasAccountForDpi } from '../../Common/Utils';
import { getNoteSlideLabel, getToolModeCursor } from '../SoundEditor';
import {
    EventsMap,
    NOTE_RESOLUTION,
    NOTES_LABELS,
    NOTES_PER_OCTAVE,
    NOTES_SPECTRUM,
    PIANO_ROLL_GRID_WIDTH,
    PIANO_ROLL_NOTE_HEIGHT_DEFAULT,
    PIANO_ROLL_NOTE_WIDTH_DEFAULT,
    ScrollWindow,
    SoundData,
    SoundEditorMarqueeMode,
    SoundEditorTool,
    SoundEvent,
    SUB_NOTE_RESOLUTION,
    TRACK_DEFAULT_INSTRUMENT_ID,
    TrackSettings
} from '../SoundEditorTypes';

interface PianoRollGridProps {
    soundData: SoundData
    tool: SoundEditorTool
    marqueeMode: SoundEditorMarqueeMode
    currentTrackId: number
    currentPatternId: string
    currentSequenceIndex: number
    setCurrentInstrumentId: Dispatch<SetStateAction<string>>
    noteCursor: number
    setNoteCursor: Dispatch<SetStateAction<number>>
    setNotes: (notes: EventsMap) => void
    newNoteDuration: number
    pianoRollNoteHeight: number
    pianoRollNoteWidth: number
    setPatternAtCursorPosition: (cursor?: number, size?: number) => void
    noteDragNoteId: number
    setNoteDragNoteId: Dispatch<SetStateAction<number>>
    noteDragStartStep: number
    setNoteDragStartStep: Dispatch<SetStateAction<number>>
    noteDragEndStep: number
    setNoteDragEndStep: Dispatch<SetStateAction<number>>
    marqueeStartStep: number
    setMarqueeStartStep: Dispatch<SetStateAction<number>>
    marqueeEndStep: number
    setMarqueeEndStep: Dispatch<SetStateAction<number>>
    marqueeStartNote: number
    setMarqueeStartNote: Dispatch<SetStateAction<number>>
    marqueeEndNote: number
    setMarqueeEndNote: Dispatch<SetStateAction<number>>
    pianoRollScrollWindow: ScrollWindow
    pianoRollRef: RefObject<HTMLDivElement>
    trackSettings: TrackSettings[]
    selectedNotes: number[]
    setSelectedNotes: (sn: number[]) => void
}

const SELECTED_PATTERN_OUTLINE_WIDTH = 3;

export default function PianoRollGrid(props: PianoRollGridProps): React.JSX.Element {
    const {
        soundData,
        tool, marqueeMode,
        currentTrackId,
        currentPatternId,
        currentSequenceIndex,
        setCurrentInstrumentId,
        noteCursor, setNoteCursor,
        setNotes,
        newNoteDuration,
        pianoRollNoteHeight, pianoRollNoteWidth,
        setPatternAtCursorPosition,
        noteDragNoteId, setNoteDragNoteId,
        noteDragStartStep, setNoteDragStartStep,
        noteDragEndStep, setNoteDragEndStep,
        marqueeStartStep, setMarqueeStartStep,
        marqueeEndStep, setMarqueeEndStep,
        marqueeStartNote, setMarqueeStartNote,
        marqueeEndNote, setMarqueeEndNote,
        pianoRollScrollWindow,
        pianoRollRef,
        trackSettings,
        selectedNotes, setSelectedNotes,
    } = props;
    const { currentThemeType, services } = useContext(EditorsContext) as EditorsContextType;
    const [isDragScrolling, setIsDragScrolling] = useState<boolean>(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const songLength = soundData.size / NOTE_RESOLUTION;
    const height = NOTES_SPECTRUM * pianoRollNoteHeight;
    const width = Math.min(
        pianoRollScrollWindow.w,
        songLength * NOTE_RESOLUTION * pianoRollNoteWidth
    );

    const getNoteLabel = (events: EventsMap, step: number) => {
        let noteLabel = events[step][SoundEvent.Note] ?? '';
        const slide = events[step][SoundEvent.NoteSlide] ?? 0;
        if (slide) {
            noteLabel += getNoteSlideLabel(events[step][SoundEvent.Note], slide);
        }
        return noteLabel;
    };

    const draw = (): void => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }

        scaleCanvasAccountForDpi(canvas, context, width, height);

        const highContrastTheme = ['hc', 'hcLight'].includes(currentThemeType);
        const c = ['light', 'hcLight'].includes(currentThemeType) ? 0 : 255;
        const highlightFullColor = context.strokeStyle = services.colorRegistry.getCurrentColor('focusBorder')!;
        const highlightMedColor = highlightFullColor + '50';
        const highlightLowColor = highlightFullColor + '20';
        const fullColor = `rgba(${c}, ${c}, ${c}, 1)`;
        const lowColor = highContrastTheme
            ? fullColor
            : `rgba(${c}, ${c}, ${c}, .1)`;
        const medColor = highContrastTheme
            ? fullColor
            : `rgba(${c}, ${c}, ${c}, .2)`;
        const hiColor = highContrastTheme
            ? fullColor
            : `rgba(${c}, ${c}, ${c}, .4)`;

        context.strokeStyle = lowColor;
        context.lineWidth = PIANO_ROLL_GRID_WIDTH;

        // highlight current pattern
        const currentPattern = soundData.patterns[currentPatternId];
        if (currentPattern && currentSequenceIndex > -1) {
            const currentPatternSize = currentPattern.size / NOTE_RESOLUTION;
            const highlightColor = services.colorRegistry.getCurrentColor('focusBorder') ?? 'red';
            const mutedHighlightColor = chroma(highlightColor).alpha(0.1).toString();
            context.fillStyle = mutedHighlightColor;
            context.fillRect(
                currentSequenceIndex * pianoRollNoteWidth - pianoRollScrollWindow.x - 0.5,
                0,
                currentPatternSize * NOTE_RESOLUTION * pianoRollNoteWidth - 0.5,
                height,
            );

            // highlight current step
            const currentSequenceIndexStartStep = currentSequenceIndex * SUB_NOTE_RESOLUTION;
            const currentSequenceIndexEndStep = (currentSequenceIndex + currentPattern.size) * SUB_NOTE_RESOLUTION;
            const relativeNoteCursor = noteCursor - currentSequenceIndexStartStep;
            // if on note inside current pattern, set cursor width accordingly
            if (
                currentPattern &&
                noteCursor >= currentSequenceIndexStartStep &&
                noteCursor < currentSequenceIndexEndStep &&
                currentPattern.events[relativeNoteCursor] !== undefined &&
                currentPattern.events[relativeNoteCursor][SoundEvent.Note] !== undefined &&
                currentPattern.events[relativeNoteCursor][SoundEvent.Duration] !== undefined
            ) {
                context.fillStyle = highlightLowColor;
                context.fillRect(
                    noteCursor / SUB_NOTE_RESOLUTION * pianoRollNoteWidth - pianoRollScrollWindow.x,
                    0,
                    currentPattern.events[relativeNoteCursor][SoundEvent.Duration] / SUB_NOTE_RESOLUTION * pianoRollNoteWidth - PIANO_ROLL_GRID_WIDTH,
                    NOTES_SPECTRUM * pianoRollNoteHeight - PIANO_ROLL_GRID_WIDTH,
                );

            }
            context.fillStyle = highlightMedColor;
            context.fillRect(
                noteCursor / SUB_NOTE_RESOLUTION * pianoRollNoteWidth - pianoRollScrollWindow.x,
                0,
                pianoRollNoteWidth - PIANO_ROLL_GRID_WIDTH,
                NOTES_SPECTRUM * pianoRollNoteHeight - PIANO_ROLL_GRID_WIDTH,
            );
        }

        // vertical lines
        for (let x = 1; x <= songLength * NOTE_RESOLUTION; x++) {
            const offsetElement = x * pianoRollNoteWidth;
            if (offsetElement < pianoRollScrollWindow.x) {
                continue;
            }
            if (offsetElement > pianoRollScrollWindow.x + pianoRollScrollWindow.w) {
                break;
            }
            const offset = offsetElement - pianoRollScrollWindow.x - 0.5;
            context.beginPath();
            context.moveTo(offset, 0);
            context.lineTo(offset, height);
            context.strokeStyle = x % NOTE_RESOLUTION === 0
                ? hiColor
                : x % 4 === 0
                    ? medColor
                    : lowColor;
            context.stroke();
        }

        // horizontal lines
        for (let y = 0; y < NOTES_SPECTRUM; y++) {
            const offset = y * pianoRollNoteHeight - 0.5;
            context.beginPath();
            context.moveTo(0, offset);
            context.lineTo(width, offset);
            context.strokeStyle = y % NOTES_PER_OCTAVE === 0
                ? hiColor
                : medColor;
            context.stroke();

            // sharp note background
            if (NOTES_LABELS[y].includes('#') && !highContrastTheme) {
                context.fillStyle = currentThemeType === 'light'
                    ? `rgba(${c}, ${c}, ${c}, .05)`
                    : 'rgba(0, 0, 0, .2)';
                context.fillRect(
                    0,
                    offset,
                    width - PIANO_ROLL_GRID_WIDTH,
                    pianoRollNoteHeight - PIANO_ROLL_GRID_WIDTH,
                );
            }
        }

        // notes
        [
            // sort current track to end to draw over eyerything else
            ...soundData.tracks.filter((t, i) => i !== currentTrackId),
            soundData.tracks[currentTrackId],
        ].map((track, trackId) => {
            Object.keys(track.sequence).forEach(sequenceIndex => {
                const isCurrentTrack = currentTrackId !== undefined && trackId === soundData.tracks.length - 1;
                if (!isCurrentTrack && trackSettings[trackId] !== undefined && !trackSettings[trackId].seeThrough) {
                    return;
                }
                const patternSi = parseInt(sequenceIndex);
                const patternId = track.sequence[patternSi];
                const pattern = soundData.patterns[patternId];
                if (!pattern) {
                    return;
                }

                const patternOffsetPx = patternSi * pianoRollNoteWidth;
                const patternWidthPx = pattern.size * pianoRollNoteWidth;
                if (pianoRollScrollWindow.x > patternOffsetPx + patternWidthPx ||
                    patternOffsetPx > pianoRollScrollWindow.x + pianoRollScrollWindow.w) {
                    return;
                }

                Object.keys(pattern.events).forEach(stepStr => {
                    const step = parseInt(stepStr);
                    const noteLabel = pattern.events[step][SoundEvent.Note] ?? '';
                    if (noteLabel !== undefined && noteLabel !== null && noteLabel !== '') {
                        const noteDurationPx = (pattern.events[step][SoundEvent.Duration] ?? 1) * pianoRollNoteWidth;
                        const noteId = NOTES_LABELS.indexOf(noteLabel);
                        const offset = (patternSi + step / SUB_NOTE_RESOLUTION) * pianoRollNoteWidth - 0.5;
                        const offsetWidth = noteDurationPx / SUB_NOTE_RESOLUTION - PIANO_ROLL_GRID_WIDTH;

                        const noteX = offset + 0.5;
                        const noteY = noteId * pianoRollNoteHeight;
                        const noteWidth = offsetWidth;
                        const noteHeight = pianoRollNoteHeight - PIANO_ROLL_GRID_WIDTH;

                        if (pianoRollScrollWindow.x > noteX + noteWidth || noteX > pianoRollScrollWindow.x + pianoRollScrollWindow.w) {
                            return;
                        }

                        const noteXOffset = noteX - pianoRollScrollWindow.x;
                        const instrumentId = pattern.events[step][SoundEvent.Instrument] ?? track.instrument;
                        const instrument = soundData.instruments[instrumentId];
                        const instrumentColor = COLOR_PALETTE[instrument?.color ?? DEFAULT_COLOR_INDEX];

                        // note rect
                        context.fillStyle = isCurrentTrack
                            ? instrumentColor
                            : lowColor;
                        context.fillRect(
                            noteXOffset,
                            noteY,
                            noteWidth,
                            noteHeight,
                        );

                        // note slide triangle
                        const noteSlide = pattern.events[step][SoundEvent.NoteSlide];
                        if (noteSlide) {
                            const path = new Path2D();
                            const noteSlideStartY = noteSlide > 0 ? noteY : noteY + noteHeight;
                            const noteSlideEndY = noteSlideStartY - noteSlide * pianoRollNoteHeight;
                            path.moveTo(noteXOffset, noteSlideStartY);
                            path.lineTo(noteXOffset + noteWidth, noteSlideStartY);
                            path.lineTo(noteXOffset + noteWidth, noteSlideEndY);
                            context.fill(path);
                        }

                        // note label
                        if (isCurrentTrack &&
                            pianoRollNoteHeight >= PIANO_ROLL_NOTE_HEIGHT_DEFAULT &&
                            noteWidth >= PIANO_ROLL_NOTE_WIDTH_DEFAULT - PIANO_ROLL_GRID_WIDTH
                        ) {
                            context.fillStyle = chroma.contrast(instrumentColor, 'white') > 2 ? 'white' : 'black';
                            context.font = '10px monospace';
                            context.fillText(getNoteLabel(pattern.events, step), noteXOffset + 2, noteY + 11, noteWidth - 4);
                        }
                    }
                });

                Object.keys(pattern.events).forEach(stepStr => {
                    const step = parseInt(stepStr);
                    const noteLabel = pattern.events[step][SoundEvent.Note] ?? '';
                    if (noteLabel !== undefined && noteLabel !== null && noteLabel !== '') {
                        const noteDurationPx = (pattern.events[step][SoundEvent.Duration] ?? 1) * pianoRollNoteWidth;
                        const offset = (patternSi + step / SUB_NOTE_RESOLUTION) * pianoRollNoteWidth - 0.5;
                        const offsetWidth = noteDurationPx / SUB_NOTE_RESOLUTION - PIANO_ROLL_GRID_WIDTH;

                        const noteX = offset + 0.5;

                        if (pianoRollScrollWindow.x > noteX + offsetWidth || noteX > pianoRollScrollWindow.x + pianoRollScrollWindow.w) {
                            return;
                        }

                        // selection outline
                        if (isCurrentTrack && currentSequenceIndex === patternSi && selectedNotes.includes(step)) {
                            const noteXOffset = noteX - pianoRollScrollWindow.x - (SELECTED_PATTERN_OUTLINE_WIDTH / 2);
                            const noteId = NOTES_LABELS.indexOf(noteLabel);
                            const noteY = noteId * pianoRollNoteHeight - (SELECTED_PATTERN_OUTLINE_WIDTH / 2);
                            const noteHeight = pianoRollNoteHeight - PIANO_ROLL_GRID_WIDTH + SELECTED_PATTERN_OUTLINE_WIDTH;
                            const noteWidth = offsetWidth + SELECTED_PATTERN_OUTLINE_WIDTH;

                            context.strokeStyle = highlightFullColor;
                            context.lineWidth = SELECTED_PATTERN_OUTLINE_WIDTH;
                            context.beginPath();
                            context.moveTo(noteXOffset, noteY);
                            context.lineTo(noteXOffset + noteWidth, noteY);
                            context.lineTo(noteXOffset + noteWidth, noteY + noteHeight);
                            context.lineTo(noteXOffset, noteY + noteHeight);
                            context.lineTo(noteXOffset, noteY);
                            context.stroke();
                            context.lineWidth = 1;
                        }
                    }
                });
            });
        });
    };

    const findNoteStep = (step: number, noteId: number): number => {
        let result = -1;
        const currentPattern = soundData.patterns[currentPatternId];
        if (!currentPattern) {
            return result;
        }

        Object.keys(currentPattern.events).forEach(s => {
            if (result > -1) {
                return;
            }
            const sInt = parseInt(s);

            const stepEvents = currentPattern.events[sInt];
            if (!stepEvents) {
                return;
            }

            const stepEventNote = stepEvents[SoundEvent.Note];
            const stepEventNoteDuration = stepEvents[SoundEvent.Duration];
            if (stepEventNote === undefined || stepEventNoteDuration === undefined) {
                return;
            }

            const stepEventNoteId = NOTES_LABELS.indexOf(stepEventNote);
            if (noteId === stepEventNoteId && step >= sInt && step < sInt + stepEventNoteDuration) {
                result = sInt;
            }
        });

        return result;
    };

    const resetNoteDrag = () => {
        setNoteDragNoteId(-1);
        setNoteDragStartStep(-1);
        setNoteDragEndStep(-1);
    };

    const resetMarquee = () => {
        setMarqueeStartStep(-1);
        setMarqueeEndStep(-1);
        setMarqueeStartNote(-1);
        setMarqueeEndNote(-1);
    };

    const handleMouseDownNoteDrag = (e: MouseEvent<HTMLCanvasElement>) => {
        if (e.button === 0 && tool === SoundEditorTool.EDIT) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left + pianoRollScrollWindow.x;
            const y = e.clientY - rect.top;

            const noteId = Math.floor(y / pianoRollNoteHeight);
            const step = Math.floor(x / pianoRollNoteWidth);

            const relativeStep = (step - currentSequenceIndex) * SUB_NOTE_RESOLUTION;
            const foundStep = findNoteStep(relativeStep, noteId);
            if (foundStep === -1) {
                setNoteDragNoteId(noteId);
                setNoteDragStartStep(step);
                setNoteDragEndStep(step + newNoteDuration / SUB_NOTE_RESOLUTION - 1);
            }
        }
    };

    const handleMouseMoveNoteDrag = (e: MouseEvent<HTMLCanvasElement>) => {
        if (noteDragNoteId !== -1 && noteDragStartStep !== -1 && noteDragEndStep !== -1) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left + pianoRollScrollWindow.x;
            const y = e.clientY - rect.top;

            const noteId = Math.floor(y / pianoRollNoteHeight);
            const step = Math.floor(x / pianoRollNoteWidth);

            if (noteId !== noteDragNoteId) {
                setNoteDragNoteId(noteId);
            }
            if (step !== noteDragEndStep) {
                setNoteDragEndStep(step);
            }
        }
    };

    const handleMouseUpNoteDrag = (e: MouseEvent<HTMLCanvasElement>) => {
        if (e.button === 0 && tool === SoundEditorTool.EDIT) {
            if (noteDragNoteId === -1 || noteDragStartStep === -1 || noteDragEndStep === -1) {
                return;
            }

            const newNoteId = noteDragNoteId;
            const newNoteStep = Math.min(noteDragStartStep, noteDragEndStep);
            const newNoteDur = (Math.abs(noteDragStartStep - noteDragEndStep) + 1) * SUB_NOTE_RESOLUTION;
            const newNoteLabel = NOTES_LABELS[newNoteId];
            const newNoteCursor = newNoteStep * SUB_NOTE_RESOLUTION;

            const currentPattern = soundData.patterns[currentPatternId];
            const currentSequenceIndexEndStep = (currentSequenceIndex + currentPattern.size);

            // if inside current pattern
            if (
                currentPattern &&
                newNoteStep >= currentSequenceIndex &&
                newNoteStep < currentSequenceIndexEndStep
            ) {
                setNotes({
                    [(newNoteStep - currentSequenceIndex) * SUB_NOTE_RESOLUTION]: {
                        [SoundEvent.Note]: newNoteLabel,
                        [SoundEvent.Duration]: newNoteDur,
                    }
                });
                setNoteCursor(newNoteCursor);
            } else {
                const newPatternSize = Math.abs(noteDragStartStep - noteDragEndStep) + 1;
                setPatternAtCursorPosition(newNoteCursor, newPatternSize);
            }

            resetNoteDrag();
        }
    };

    const handleMouseUpNoteSelect = (e: MouseEvent<HTMLCanvasElement>) => {
        if ((tool === SoundEditorTool.EDIT || tool === SoundEditorTool.ERASER) && e.button === 0) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left + pianoRollScrollWindow.x;
            const y = e.clientY - rect.top;

            const noteId = Math.floor(y / pianoRollNoteHeight);
            const step = Math.floor(x / pianoRollNoteWidth);

            const relativeStep = (step - currentSequenceIndex) * SUB_NOTE_RESOLUTION;
            const foundStep = findNoteStep(relativeStep, noteId);
            if (foundStep > -1) {
                if (tool === SoundEditorTool.EDIT) {
                    if (e.metaKey || e.ctrlKey) {
                        if (selectedNotes.includes(foundStep)) {
                            setSelectedNotes(selectedNotes.filter(sn => sn !== foundStep).sort());
                        } else {
                            setSelectedNotes([...selectedNotes, foundStep].sort());
                        }
                    } else {
                        const currentPattern = soundData.patterns[currentPatternId];
                        const stepEvent = currentPattern.events[foundStep];
                        if (stepEvent) {
                            const instrumentId = stepEvent[SoundEvent.Instrument];
                            setCurrentInstrumentId(instrumentId ?? TRACK_DEFAULT_INSTRUMENT_ID);
                        }
                        if (!selectedNotes.includes(foundStep)) {
                            setSelectedNotes([foundStep]);
                        }
                        setNoteCursor(foundStep + (currentSequenceIndex * SUB_NOTE_RESOLUTION));
                    }
                } else if (tool === SoundEditorTool.ERASER) {
                    setNotes({ [foundStep]: {} });
                }
            }
        }
    };

    const handleMouseDownDragScrolling = (e: MouseEvent<HTMLCanvasElement>) => {
        if (tool === SoundEditorTool.DRAG || e.button === 1) {
            setIsDragScrolling(true);
        }
    };

    const handleMouseMoveDragScrolling = (e: MouseEvent<HTMLCanvasElement>) => {
        if (isDragScrolling) {
            if (e.movementX !== 0 || e.movementY !== 0) {
                pianoRollRef.current?.scrollBy({
                    left: -e.movementX,
                    top: -e.movementY,
                });
            }
        }
    };

    const handleMouseUpDragScrolling = (e: MouseEvent<HTMLCanvasElement>) => {
        if (tool === SoundEditorTool.DRAG || e.button === 1) {
            setIsDragScrolling(false);
        }
    };

    const handleMouseDownMarquee = (e: MouseEvent<HTMLCanvasElement>) => {
        if (e.button === 0 && tool === SoundEditorTool.MARQUEE || e.button === 2 && tool !== SoundEditorTool.DRAG) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left + pianoRollScrollWindow.x;
            const y = e.clientY - rect.top;

            const noteId = Math.floor(y / pianoRollNoteHeight);
            const step = Math.floor(x / pianoRollNoteWidth);

            const currentPattern = soundData.patterns[currentPatternId];
            const currentSequenceIndexEndStep = (currentSequenceIndex + currentPattern.size);

            // if inside current pattern
            if (
                currentPattern &&
                step >= currentSequenceIndex &&
                step < currentSequenceIndexEndStep
            ) {
                setMarqueeStartStep(step);
                setMarqueeEndStep(step);
                setMarqueeStartNote(noteId);
                setMarqueeEndNote(noteId);
            }
        }
    };

    const handleMouseMoveMarquee = (e: MouseEvent<HTMLCanvasElement>) => {
        if (marqueeStartStep !== -1 && marqueeEndStep !== -1) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left + pianoRollScrollWindow.x;
            const y = e.clientY - rect.top;

            const noteId = Math.floor(y / pianoRollNoteHeight);
            const step = Math.floor(x / pianoRollNoteWidth);

            if (step !== marqueeEndStep) {
                const currentPattern = soundData.patterns[currentPatternId];
                const currentSequenceIndexStartStep = currentSequenceIndex;
                const currentSequenceIndexEndStep = (currentSequenceIndex + currentPattern.size);

                // if inside current pattern
                if (
                    currentPattern &&
                    step >= currentSequenceIndexStartStep &&
                    step < currentSequenceIndexEndStep
                ) {
                    setMarqueeEndStep(step);
                    setMarqueeEndNote(noteId);
                }
            }
        }
    };

    const handleMouseUpMarquee = (e: MouseEvent<HTMLCanvasElement>) => {
        if (e.button === 0 && tool === SoundEditorTool.MARQUEE || e.button === 2 && tool !== SoundEditorTool.DRAG) {
            if (marqueeStartStep === -1 || marqueeEndStep === -1 || marqueeStartNote === -1 || marqueeEndNote === -1) {
                return;
            }

            const sortedMarqueeStartStep = Math.min(marqueeStartStep, marqueeEndStep);
            const sortedMarqueeEndStep = Math.max(marqueeStartStep, marqueeEndStep);
            const sortedMarqueeStartNote = Math.min(marqueeStartNote, marqueeEndNote);
            const sortedMarqueeEndNote = Math.max(marqueeStartNote, marqueeEndNote);

            const currentPattern = soundData.patterns[currentPatternId];
            const currentSequenceIndexStartStep = currentSequenceIndex;
            const currentSequenceIndexEndStep = (currentSequenceIndex + currentPattern.size);

            const currentPatternStartStep = currentSequenceIndex * SUB_NOTE_RESOLUTION;

            // if inside current pattern
            if (
                currentPattern &&
                sortedMarqueeStartStep >= currentSequenceIndexStartStep &&
                sortedMarqueeStartStep < currentSequenceIndexEndStep
            ) {
                const patternRelativeMarqueeStartStep = sortedMarqueeStartStep * SUB_NOTE_RESOLUTION - currentPatternStartStep;
                const patternRelativeMarqueeEndStep = sortedMarqueeEndStep * SUB_NOTE_RESOLUTION - currentPatternStartStep;
                const newSelectedNotes = Object.keys(currentPattern.events)
                    .map(n => parseInt(n))
                    .filter(eventStep =>
                        currentPattern.events[eventStep][SoundEvent.Note] !== undefined &&
                        NOTES_LABELS.indexOf(currentPattern.events[eventStep][SoundEvent.Note]) > sortedMarqueeStartNote &&
                        NOTES_LABELS.indexOf(currentPattern.events[eventStep][SoundEvent.Note]) <= sortedMarqueeEndNote &&
                        ((currentPattern.events[eventStep][SoundEvent.Duration] !== undefined &&
                            eventStep + parseInt(currentPattern.events[eventStep][SoundEvent.Duration]) > patternRelativeMarqueeStartStep) ||
                            eventStep >= patternRelativeMarqueeStartStep) &&
                        eventStep <= patternRelativeMarqueeEndStep
                    );

                if (marqueeMode === SoundEditorMarqueeMode.ADD) {
                    setSelectedNotes([...selectedNotes, ...newSelectedNotes]);
                } else if (marqueeMode === SoundEditorMarqueeMode.SUBTRACT) {
                    setSelectedNotes([...selectedNotes, ...newSelectedNotes]
                        .filter(item => !(selectedNotes.includes(item) && newSelectedNotes.includes(item)))
                        .sort()
                    );
                } else if (marqueeMode === SoundEditorMarqueeMode.REPLACE) {
                    setSelectedNotes(newSelectedNotes);
                }

                if (newSelectedNotes.length === 0) {
                    setNoteCursor(sortedMarqueeStartStep * SUB_NOTE_RESOLUTION);
                }
            }

            resetMarquee();
        }
    };

    const onMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
        handleMouseDownNoteDrag(e);
        handleMouseDownDragScrolling(e);
        handleMouseDownMarquee(e);
    };

    const onMouseUp = (e: MouseEvent<HTMLCanvasElement>) => {
        handleMouseUpNoteDrag(e);
        handleMouseUpNoteSelect(e);
        handleMouseUpDragScrolling(e);
        handleMouseUpMarquee(e);
    };

    const onMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
        handleMouseMoveNoteDrag(e);
        handleMouseMoveDragScrolling(e);
        handleMouseMoveMarquee(e);
    };

    const onMouseLeave = (e: MouseEvent<HTMLCanvasElement>) => {
        setIsDragScrolling(false);
        resetNoteDrag();
        resetMarquee();
    };

    useEffect(() => {
        draw();
    }, [
        currentThemeType,
        soundData,
        currentTrackId,
        currentPatternId,
        currentSequenceIndex,
        noteCursor,
        pianoRollNoteHeight,
        pianoRollNoteWidth,
        pianoRollScrollWindow.x,
        pianoRollScrollWindow.w,
        selectedNotes,
        trackSettings,
    ]);

    return (
        <canvas
            style={{
                cursor: getToolModeCursor(tool, isDragScrolling),
            }}
            height={height}
            width={width}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            ref={canvasRef}
        />
    );
}
