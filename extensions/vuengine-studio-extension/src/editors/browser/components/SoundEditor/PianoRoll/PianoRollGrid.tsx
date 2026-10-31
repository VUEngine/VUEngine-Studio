import chroma from 'chroma-js';
import React, { Dispatch, MouseEvent, RefObject, SetStateAction, useContext, useEffect, useRef, useState } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';
import { clamp, scaleCanvasAccountForDpi } from '../../Common/Utils';
import { drawSongEnd } from '../EffectsPanel/EffectsPanelGridOverview';
import { getMaxNoteDuration, getNoteMoveChanges } from '../Other/Note';
import { getGridLine, getTimeSignatureSegments } from '../Other/timeSignature';
import { getNoteSlideLabel, getToolModeCursor } from '../SoundEditor';
import {
    EventsMap,
    NOTE_PLAY_STOP_DELAY,
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
    SoundEventMap,
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
    currentInstrumentId: string
    setCurrentInstrumentId: (instrumentId: string) => void
    noteCursor: number
    setNoteCursor: (step: number) => void
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
    playNote: (note: string, instrumentId?: string) => void
    playing: boolean
    testNote: string
    editCurrentNote: () => void
    openSongLengthDialog: () => void
    noteSnapping: boolean
    previewNotes: EventsMap | undefined
    pasting: boolean
    setPastePosition: (position: { step: number, noteId: number }) => void
    commitPaste: () => void
    cancelPaste: () => void
}

const SELECTED_PATTERN_OUTLINE_WIDTH = 3;
// how far the mouse has to move before grabbing a note moves or resizes it, so that clicks do not
const NOTE_DRAG_THRESHOLD = 3;

type NoteDragMode = 'move' | 'duration' | 'slide';

const NOTE_DRAG_CURSORS: Record<NoteDragMode, string> = {
    move: 'move',
    duration: 'ew-resize',
    slide: 'ns-resize',
};

interface NoteHit {
    step: number
    mode: NoteDragMode
}

interface NoteDrag extends NoteHit {
    steps: number[]
    startX: number
    startY: number
    changes?: EventsMap
    stepOffset?: number
}

export default function PianoRollGrid(props: PianoRollGridProps): React.JSX.Element {
    const {
        soundData,
        tool, marqueeMode,
        currentTrackId,
        currentPatternId,
        currentSequenceIndex,
        currentInstrumentId,
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
        playNote,
        playing, testNote,
        editCurrentNote,
        openSongLengthDialog,
        noteSnapping,
        previewNotes, pasting, setPastePosition, commitPaste, cancelPaste,
    } = props;
    const { currentThemeType, services } = useContext(EditorsContext) as EditorsContextType;
    const [isDragScrolling, setIsDragScrolling] = useState<boolean>(false);
    const [noteDragInitialX, setNoteDragInitialX] = useState<number>(-1);
    const [noteDrag, setNoteDrag] = useState<NoteDrag>();
    const [hoveredNoteDragMode, setHoveredNoteDragMode] = useState<NoteDragMode>();
    // the click which places pasted notes must not select anything when the mouse button gets released
    const ignoreNextMouseUpRef = useRef<boolean>(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const height = NOTES_SPECTRUM * pianoRollNoteHeight;
    // always as wide as the view, even if the sound is shorter
    const width = pianoRollScrollWindow.w;

    const getNoteLabel = (events: EventsMap, step: number) => {
        let noteLabel = events[step][SoundEvent.Note] ?? '';
        const slide = events[step][SoundEvent.NoteSlide] ?? 0;
        if (slide) {
            noteLabel += getNoteSlideLabel(events[step][SoundEvent.Note], slide);
        }
        return noteLabel;
    };

    // while resizing or sliding, the notes of the current pattern get drawn as they would become
    const noteDragOverrides = noteDrag?.mode !== 'move' ? noteDrag?.changes : undefined;
    const getDrawnEvents = (events: EventsMap): EventsMap => noteDragOverrides
        ? {
            ...events,
            ...Object.fromEntries(Object.keys(noteDragOverrides).map(step => [step, {
                ...events[parseInt(step)],
                ...noteDragOverrides[parseInt(step)],
            }])),
        }
        : events;

    // while moving, the notes get previewed at their new positions, like pasted ones
    const noteDragPreview = noteDrag?.mode === 'move' && noteDrag.changes
        ? Object.fromEntries(Object.entries(noteDrag.changes).filter(([step, events]) => events[SoundEvent.Note] !== undefined))
        : undefined;
    const ghostNotes = previewNotes ?? noteDragPreview;

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
            const highlightColor = services.colorRegistry.getCurrentColor('focusBorder') ?? 'red';
            const mutedHighlightColor = chroma(highlightColor).alpha(0.1).toString();
            context.fillStyle = mutedHighlightColor;
            context.fillRect(
                currentSequenceIndex * pianoRollNoteWidth - pianoRollScrollWindow.x - 0.5,
                0,
                currentPattern.size * pianoRollNoteWidth - 0.5,
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
        const timeSignatureSegments = getTimeSignatureSegments(soundData);
        // the grid continues after the end of the sound, see drawSongEnd
        const lastColumn = Math.max(soundData.size, Math.ceil((pianoRollScrollWindow.x + pianoRollScrollWindow.w) / pianoRollNoteWidth));
        for (let x = 1; x <= lastColumn; x++) {
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
            const gridLine = getGridLine(timeSignatureSegments, x);
            context.strokeStyle = gridLine.isBarStart
                ? hiColor
                : gridLine.isBeatStart
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
        // sort current track to end to draw over eyerything else,
        // but keep the tracks' indexes for their settings
        const trackIds = soundData.tracks.map((t, i) => i).filter(i => i !== currentTrackId);
        if (soundData.tracks[currentTrackId] !== undefined) {
            trackIds.push(currentTrackId);
        }
        trackIds.forEach(trackId => {
            const track = soundData.tracks[trackId];
            Object.keys(track.sequence).forEach(sequenceIndex => {
                const isCurrentTrack = trackId === currentTrackId;
                if (!isCurrentTrack && trackSettings[trackId] !== undefined && !trackSettings[trackId].seeThrough) {
                    return;
                }
                const patternSi = parseInt(sequenceIndex);
                const patternId = track.sequence[patternSi];
                const pattern = soundData.patterns[patternId];
                if (!pattern) {
                    return;
                }
                const events = isCurrentTrack && patternId === currentPatternId
                    ? getDrawnEvents(pattern.events)
                    : pattern.events;

                const patternOffsetPx = patternSi * pianoRollNoteWidth;
                const patternWidthPx = pattern.size * pianoRollNoteWidth;
                if (pianoRollScrollWindow.x > patternOffsetPx + patternWidthPx ||
                    patternOffsetPx > pianoRollScrollWindow.x + pianoRollScrollWindow.w) {
                    return;
                }

                Object.keys(events).forEach(stepStr => {
                    const step = parseInt(stepStr);
                    const noteLabel = events[step][SoundEvent.Note] ?? '';
                    if (noteLabel !== undefined && noteLabel !== null && noteLabel !== '') {
                        const noteDurationPx = (events[step][SoundEvent.Duration] ?? 1) * pianoRollNoteWidth;
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
                        const instrumentId = events[step][SoundEvent.Instrument] ?? track.instrument;
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
                        const noteSlide = events[step][SoundEvent.NoteSlide];
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
                            context.fillText(getNoteLabel(events, step), noteXOffset + 2, noteY + 11, noteWidth - 4);
                        }
                    }
                });

                Object.keys(events).forEach(stepStr => {
                    const step = parseInt(stepStr);
                    const noteLabel = events[step][SoundEvent.Note] ?? '';
                    if (noteLabel !== undefined && noteLabel !== null && noteLabel !== '') {
                        const noteDurationPx = (events[step][SoundEvent.Duration] ?? 1) * pianoRollNoteWidth;
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

        // notes being pasted or dragged, at the positions they would get
        if (ghostNotes && currentPattern) {
            const track = soundData.tracks[currentTrackId];
            Object.keys(ghostNotes).forEach(stepStr => {
                const step = parseInt(stepStr);
                const events = ghostNotes[step];
                const noteId = NOTES_LABELS.indexOf(events[SoundEvent.Note]);
                const noteX = (currentSequenceIndex + step / SUB_NOTE_RESOLUTION) * pianoRollNoteWidth - pianoRollScrollWindow.x;
                const noteWidth = Math.max(1, (events[SoundEvent.Duration] ?? SUB_NOTE_RESOLUTION) * pianoRollNoteWidth / SUB_NOTE_RESOLUTION - PIANO_ROLL_GRID_WIDTH);
                const noteY = noteId * pianoRollNoteHeight;
                const instrument = soundData.instruments[events[SoundEvent.Instrument] ?? track?.instrument];
                const instrumentColor = COLOR_PALETTE[instrument?.color ?? DEFAULT_COLOR_INDEX];

                context.fillStyle = chroma(instrumentColor).alpha(0.6).toString();
                context.fillRect(noteX, noteY, noteWidth, pianoRollNoteHeight - PIANO_ROLL_GRID_WIDTH);
                context.strokeStyle = highlightFullColor;
                context.lineWidth = 1;
                context.setLineDash([3, 2]);
                context.strokeRect(noteX + 0.5, noteY + 0.5, noteWidth - 1, pianoRollNoteHeight - PIANO_ROLL_GRID_WIDTH - 1);
                context.setLineDash([]);
            });
        }

        drawSongEnd(context, currentThemeType, soundData.size * pianoRollNoteWidth, pianoRollScrollWindow.x, width, height);
    };

    // while pasting, the first copied note follows the mouse, snapped to whole 1/16 notes with snapping
    const updatePastePosition = (e: MouseEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left + pianoRollScrollWindow.x;
        const y = e.clientY - rect.top;
        const step = (noteSnapping
            ? Math.floor(x / pianoRollNoteWidth) * SUB_NOTE_RESOLUTION
            : Math.floor(x * SUB_NOTE_RESOLUTION / pianoRollNoteWidth)
        ) - currentSequenceIndex * SUB_NOTE_RESOLUTION;
        const patternSize = (soundData.patterns[currentPatternId]?.size ?? 0) * SUB_NOTE_RESOLUTION;
        setPastePosition({
            step: Math.min(Math.max(0, step), patternSize - 1),
            noteId: Math.floor(y / pianoRollNoteHeight),
        });
    };

    const findNoteStep = (step: number, noteId: number): number => {
        const currentPattern = soundData.patterns[currentPatternId];
        if (!currentPattern) {
            return -1;
        }

        let slideResult = -1;
        for (const s of Object.keys(currentPattern.events)) {
            const sInt = parseInt(s);
            const stepEvents = currentPattern.events[sInt];
            const stepEventNote = stepEvents?.[SoundEvent.Note];
            const stepEventNoteDuration = stepEvents?.[SoundEvent.Duration];
            if (stepEventNote === undefined || stepEventNoteDuration === undefined || step < sInt || step >= sInt + stepEventNoteDuration) {
                continue;
            }

            const stepEventNoteId = NOTES_LABELS.indexOf(stepEventNote);
            if (noteId === stepEventNoteId) {
                return sInt;
            }

            const noteSlide = stepEvents[SoundEvent.NoteSlide] ?? 0;
            const distance = noteSlide > 0 ? stepEventNoteId - noteId : noteId - stepEventNoteId;
            if (slideResult === -1 && noteSlide !== 0 && distance >= 1 && distance <= Math.abs(noteSlide)) {
                // how far the triangle reaches at the clicked position
                const progress = Math.min(1, (step - sInt) / stepEventNoteDuration);
                if (distance - 1 < progress * Math.abs(noteSlide)) {
                    slideResult = sInt;
                }
            }
        }

        return slideResult;
    };

    const getMousePosition = (e: MouseEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        return {
            x: e.clientX - rect.left + pianoRollScrollWindow.x,
            y: e.clientY - rect.top,
        };
    };

    // the exact, possibly fractional, step relative to the current pattern at the given x position
    const getPatternStep = (x: number): number =>
        x * SUB_NOTE_RESOLUTION / pianoRollNoteWidth - currentSequenceIndex * SUB_NOTE_RESOLUTION;

    // notes get resized at their right edge, slid at their top and bottom edges or by their slide triangle,
    // and moved anywhere else
    const getNoteHit = (x: number, y: number): NoteHit | undefined => {
        const currentPattern = soundData.patterns[currentPatternId];
        const step = findNoteStep(getPatternStep(x), Math.floor(y / pianoRollNoteHeight));
        if (!currentPattern || step === -1) {
            return;
        }

        const events = currentPattern.events[step];
        const noteY = NOTES_LABELS.indexOf(events[SoundEvent.Note]) * pianoRollNoteHeight;
        if (y < noteY || y >= noteY + pianoRollNoteHeight) {
            return { step, mode: 'slide' };
        }

        const noteWidth = events[SoundEvent.Duration] * pianoRollNoteWidth / SUB_NOTE_RESOLUTION - PIANO_ROLL_GRID_WIDTH;
        const noteRight = (currentSequenceIndex + step / SUB_NOTE_RESOLUTION) * pianoRollNoteWidth + noteWidth;
        if (noteWidth >= 8 && x >= noteRight - Math.min(6, noteWidth / 4)) {
            return { step, mode: 'duration' };
        }

        const slideEdge = Math.min(3, Math.floor(pianoRollNoteHeight / 5));
        if (pianoRollNoteHeight >= 10 && (y < noteY + slideEdge || y >= noteY + pianoRollNoteHeight - PIANO_ROLL_GRID_WIDTH - slideEdge)) {
            return { step, mode: 'slide' };
        }

        return { step, mode: 'move' };
    };

    // with the marquee tool, only selected notes can be grabbed, as clicking elsewhere starts a marquee
    const isGrabbable = (hit: NoteHit): boolean =>
        tool === SoundEditorTool.EDIT ||
        tool === SoundEditorTool.MARQUEE && marqueeMode === SoundEditorMarqueeMode.REPLACE && selectedNotes.includes(hit.step);

    const getNoteDragChanges = (drag: NoteDrag, x: number, y: number): { changes: EventsMap, stepOffset: number } => {
        const currentPattern = soundData.patterns[currentPatternId];
        const events = currentPattern.events;
        const steps = drag.steps.filter(step => events[step]?.[SoundEvent.Note] !== undefined);
        const deltaSteps = (x - drag.startX) * SUB_NOTE_RESOLUTION / pianoRollNoteWidth;
        const deltaNotes = Math.round((y - drag.startY) / pianoRollNoteHeight);
        const changes: EventsMap = {};

        switch (drag.mode) {
            case 'move': {
                // with snapping, the grabbed note lands on the start of a 1/16 note
                const stepOffset = clamp(
                    noteSnapping
                        ? Math.round((drag.step + deltaSteps) / SUB_NOTE_RESOLUTION) * SUB_NOTE_RESOLUTION - drag.step
                        : Math.round(deltaSteps),
                    Math.min(0, -Math.min(...steps)),
                    Math.max(0, currentPattern.size * SUB_NOTE_RESOLUTION - Math.max(...steps.map(step => step + (events[step][SoundEvent.Duration] ?? 0))))
                );
                const noteIds = steps.map(step => NOTES_LABELS.indexOf(events[step][SoundEvent.Note]));
                const noteOffset = clamp(deltaNotes, -Math.min(...noteIds), NOTES_SPECTRUM - 1 - Math.max(...noteIds));

                return {
                    changes: stepOffset !== 0 || noteOffset !== 0
                        ? getNoteMoveChanges(events, steps, currentPattern.size, stepOffset, noteOffset)
                        : {},
                    stepOffset,
                };
            }
            case 'duration': {
                // all notes get longer or shorter by the same amount, in multiples of the new note duration with snapping
                const unit = noteSnapping ? newNoteDuration * SUB_NOTE_RESOLUTION : 1;
                const durationDelta = Math.round(deltaSteps / unit) * unit;
                if (durationDelta === 0) {
                    break;
                }
                steps.forEach(step => {
                    const duration = events[step][SoundEvent.Duration] ?? SUB_NOTE_RESOLUTION;
                    const newDuration = clamp(
                        duration + durationDelta,
                        noteSnapping ? SUB_NOTE_RESOLUTION : 1,
                        // notes which already overlap the next one do not get shortened by making them longer
                        Math.max(duration, getMaxNoteDuration(events, step, currentPattern.size))
                    );
                    if (newDuration !== duration) {
                        changes[step] = { [SoundEvent.Duration]: newDuration };
                    }
                });
                break;
            }
            case 'slide': {
                // all notes get the slide of the grabbed one, as far as their target notes exist
                const slide = (events[drag.step][SoundEvent.NoteSlide] ?? 0) - deltaNotes;
                steps.forEach(step => {
                    const noteId = NOTES_LABELS.indexOf(events[step][SoundEvent.Note]);
                    const newSlide = clamp(slide, noteId - NOTES_SPECTRUM + 1, noteId);
                    if (newSlide !== (events[step][SoundEvent.NoteSlide] ?? 0)) {
                        changes[step] = { [SoundEvent.NoteSlide]: newSlide !== 0 ? newSlide : undefined };
                    }
                });
                break;
            }
        }

        return { changes, stepOffset: 0 };
    };

    // clicking a note in the current pattern selects it and grabs it, together with all other selected notes
    const handleMouseDownNote = (e: MouseEvent<HTMLCanvasElement>): boolean => {
        if (tool !== SoundEditorTool.EDIT && tool !== SoundEditorTool.MARQUEE) {
            return false;
        }
        const { x, y } = getMousePosition(e);
        const hit = getNoteHit(x, y);
        if (!hit || !isGrabbable(hit)) {
            return false;
        }

        if (e.button === 2) {
            // with modifiers, right clicking deletes the note on mouse up instead
            if (tool !== SoundEditorTool.EDIT || e.metaKey || e.ctrlKey || e.altKey) {
                return false;
            }
            setSelectedNotes(selectedNotes.includes(hit.step)
                ? selectedNotes.filter(sn => sn !== hit.step)
                : [...selectedNotes, hit.step]);
            return true;
        }
        if (e.button !== 0) {
            return false;
        }

        let steps = selectedNotes;
        if (tool === SoundEditorTool.EDIT) {
            if (e.metaKey || e.ctrlKey) {
                if (selectedNotes.includes(hit.step)) {
                    setSelectedNotes(selectedNotes.filter(sn => sn !== hit.step));
                    return true;
                }
                steps = [...selectedNotes, hit.step];
            } else {
                const instrumentId = soundData.patterns[currentPatternId].events[hit.step][SoundEvent.Instrument];
                setCurrentInstrumentId(instrumentId ?? TRACK_DEFAULT_INSTRUMENT_ID);
                if (!selectedNotes.includes(hit.step)) {
                    steps = [hit.step];
                }
                setNoteCursor(hit.step + currentSequenceIndex * SUB_NOTE_RESOLUTION);
            }
            if (steps !== selectedNotes) {
                setSelectedNotes(steps);
            }
        }

        setNoteDrag({ ...hit, steps, startX: x, startY: y });
        return true;
    };

    const handleMouseMoveNote = (e: MouseEvent<HTMLCanvasElement>) => {
        const { x, y } = getMousePosition(e);
        if (noteDrag) {
            if (!noteDrag.changes && Math.abs(x - noteDrag.startX) < NOTE_DRAG_THRESHOLD && Math.abs(y - noteDrag.startY) < NOTE_DRAG_THRESHOLD) {
                return;
            }
            const { changes, stepOffset } = getNoteDragChanges(noteDrag, x, y);
            if (!noteDrag.changes || JSON.stringify(changes) !== JSON.stringify(noteDrag.changes)) {
                setNoteDrag({ ...noteDrag, changes, stepOffset });
            }
            return;
        }

        let mode: NoteDragMode | undefined;
        if (noteDragStartStep === -1 && marqueeStartStep === -1) {
            const hit = getNoteHit(x, y);
            if (hit && isGrabbable(hit)) {
                mode = hit.mode;
            }
        }
        if (mode !== hoveredNoteDragMode) {
            setHoveredNoteDragMode(mode);
        }
    };

    const handleMouseUpNote = (): boolean => {
        if (!noteDrag) {
            return false;
        }

        const changes = noteDrag.changes;
        setNoteDrag(undefined);
        if (changes && Object.keys(changes).length) {
            setNotes(changes);
            if (noteDrag.mode === 'move') {
                setSelectedNotes(Object.keys(changes)
                    .map(n => parseInt(n))
                    .filter(n => changes[n][SoundEvent.Note] !== undefined));
                setNoteCursor(noteDrag.step + (noteDrag.stepOffset ?? 0) + currentSequenceIndex * SUB_NOTE_RESOLUTION);
            }
        }

        return true;
    };

    const resetNoteDrag = () => {
        if (playing && !!testNote) {
            setTimeout(() => playNote(''), NOTE_PLAY_STOP_DELAY);
        }
        setNoteDragNoteId(-1);
        setNoteDragStartStep(-1);
        setNoteDragEndStep(-1);
        setNoteDragInitialX(-1);
    };

    const resetMarquee = () => {
        setMarqueeStartStep(-1);
        setMarqueeEndStep(-1);
        setMarqueeStartNote(-1);
        setMarqueeEndNote(-1);
    };

    // the instrument a new note gets, so its test sound uses it, too
    const newNoteInstrumentId = currentInstrumentId && currentInstrumentId !== TRACK_DEFAULT_INSTRUMENT_ID
        ? currentInstrumentId
        : undefined;

    const handleMouseDownNoteDrag = (e: MouseEvent<HTMLCanvasElement>) => {
        if (e.button === 0 && tool === SoundEditorTool.EDIT) {
            const { x, y } = getMousePosition(e);

            const noteId = Math.floor(y / pianoRollNoteHeight);
            const step = Math.floor(x / pianoRollNoteWidth);

            const foundStep = findNoteStep(getPatternStep(x), noteId);
            if (foundStep === -1) {
                setNoteDragNoteId(noteId);
                setNoteDragStartStep(step);
                setNoteDragInitialX(e.clientX);
                setNoteDragEndStep(step + newNoteDuration - 1);

                if (!playing || !!testNote) {
                    const currentPattern = soundData.patterns[currentPatternId];
                    const currentSequenceIndexEndStep = (currentSequenceIndex + (currentPattern?.size ?? 0));
                    if (
                        currentPattern &&
                        step >= currentSequenceIndex &&
                        step < currentSequenceIndexEndStep
                    ) {
                        playNote(NOTES_LABELS[noteId], newNoteInstrumentId);
                    }
                }
            }
        }
    };

    const handleMouseMoveNoteDrag = (e: MouseEvent<HTMLCanvasElement>) => {
        if (noteDragInitialX === 1 || Math.abs(noteDragInitialX - e.clientX) < pianoRollNoteWidth) {
            return;
        }

        if (noteDragNoteId !== -1 && noteDragStartStep !== -1 && noteDragEndStep !== -1) {
            setNoteDragInitialX(-1);

            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left + pianoRollScrollWindow.x;
            const y = e.clientY - rect.top;

            const noteId = Math.floor(y / pianoRollNoteHeight);
            const step = Math.floor(x / pianoRollNoteWidth);

            if (noteId !== noteDragNoteId) {
                setNoteDragNoteId(noteId);
                playNote(NOTES_LABELS[noteId], newNoteInstrumentId);
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
            const currentSequenceIndexEndStep = (currentSequenceIndex + (currentPattern?.size ?? 0));

            // if inside current pattern
            if (
                currentPattern &&
                newNoteStep >= currentSequenceIndex &&
                newNoteStep < currentSequenceIndexEndStep
            ) {
                const step = (newNoteStep - currentSequenceIndex) * SUB_NOTE_RESOLUTION;
                const stepEvents: SoundEventMap = {
                    [SoundEvent.Note]: newNoteLabel,
                    [SoundEvent.Duration]: newNoteDur,
                };

                if (currentInstrumentId && currentInstrumentId !== TRACK_DEFAULT_INSTRUMENT_ID) {
                    stepEvents[SoundEvent.Instrument] = currentInstrumentId;
                }

                setNotes({ [step]: stepEvents });
                setNoteCursor(newNoteCursor);
            } else {
                const newPatternSize = Math.abs(noteDragStartStep - noteDragEndStep) + 1;
                setPatternAtCursorPosition(newNoteCursor, newPatternSize);
            }

            resetNoteDrag();
        }
    };

    const handleMouseUpNoteErase = (e: MouseEvent<HTMLCanvasElement>) => {
        if (tool === SoundEditorTool.EDIT || tool === SoundEditorTool.ERASER) {
            const { x, y } = getMousePosition(e);
            const foundStep = findNoteStep(getPatternStep(x), Math.floor(y / pianoRollNoteHeight));
            if (foundStep > -1 && (
                tool === SoundEditorTool.ERASER && e.button === 0 ||
                (e.metaKey || e.ctrlKey || e.altKey) && e.button === 2
            )) {
                setNotes({ [foundStep]: {} });
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

            // if inside current pattern
            if (
                currentPattern &&
                step >= currentSequenceIndex &&
                step < currentSequenceIndex + currentPattern.size
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
                        NOTES_LABELS.indexOf(currentPattern.events[eventStep][SoundEvent.Note]) >= sortedMarqueeStartNote &&
                        NOTES_LABELS.indexOf(currentPattern.events[eventStep][SoundEvent.Note]) <= sortedMarqueeEndNote &&
                        ((currentPattern.events[eventStep][SoundEvent.Duration] !== undefined &&
                            eventStep + parseInt(currentPattern.events[eventStep][SoundEvent.Duration]) > patternRelativeMarqueeStartStep) ||
                            eventStep >= patternRelativeMarqueeStartStep) &&
                        eventStep <= patternRelativeMarqueeEndStep
                    );

                if (marqueeMode === SoundEditorMarqueeMode.ADD) {
                    setSelectedNotes([...selectedNotes, ...newSelectedNotes.filter(item => !selectedNotes.includes(item))]);
                } else if (marqueeMode === SoundEditorMarqueeMode.SUBTRACT) {
                    setSelectedNotes(selectedNotes.filter(item => !newSelectedNotes.includes(item)));
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

    // the area after the end of the sound only allows scrolling
    const isWithinSong = (e: MouseEvent<HTMLCanvasElement>): boolean =>
        e.clientX - e.currentTarget.getBoundingClientRect().left + pianoRollScrollWindow.x < soundData.size * pianoRollNoteWidth;

    const onMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
        if (pasting) {
            ignoreNextMouseUpRef.current = true;
            if (e.button === 0) {
                updatePastePosition(e);
                commitPaste();
            } else {
                cancelPaste();
            }
            return;
        }
        handleMouseDownDragScrolling(e);
        if (isWithinSong(e)) {
            if (!handleMouseDownNote(e)) {
                handleMouseDownNoteDrag(e);
                handleMouseDownMarquee(e);
            }
        } else if (e.button === 0 && tool !== SoundEditorTool.DRAG) {
            // clicking after the end of the sound offers to change its length
            openSongLengthDialog();
        }
    };

    const onMouseUp = (e: MouseEvent<HTMLCanvasElement>) => {
        if (ignoreNextMouseUpRef.current) {
            ignoreNextMouseUpRef.current = false;
            return;
        }
        if (handleMouseUpNote()) {
            return;
        }
        handleMouseUpNoteDrag(e);
        handleMouseUpNoteErase(e);
        handleMouseUpDragScrolling(e);
        handleMouseUpMarquee(e);
    };

    const onMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
        if (pasting) {
            updatePastePosition(e);
            return;
        }
        handleMouseMoveDragScrolling(e);
        if (isWithinSong(e)) {
            handleMouseMoveNote(e);
            handleMouseMoveNoteDrag(e);
            handleMouseMoveMarquee(e);
        }
    };

    // double-clicking a note opens it for editing, the first click has already moved the note cursor to it
    const onDoubleClick = (e: MouseEvent<HTMLCanvasElement>) => {
        if (tool !== SoundEditorTool.EDIT) {
            return;
        }
        const { x, y } = getMousePosition(e);
        if (findNoteStep(getPatternStep(x), Math.floor(y / pianoRollNoteHeight)) > -1) {
            editCurrentNote();
        }
    };

    const onMouseLeave = (e: MouseEvent<HTMLCanvasElement>) => {
        setIsDragScrolling(false);
        setNoteDrag(undefined);
        setHoveredNoteDragMode(undefined);
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
        previewNotes,
        noteDrag,
    ]);

    const onKeyDown = (e: KeyboardEvent): void => {
        if (!e.repeat && e.code === 'Escape' &&
            (noteDragStartStep !== -1 || marqueeStartStep !== -1 || noteDrag)) {
            resetMarquee();
            resetNoteDrag();
            setNoteDrag(undefined);
        }
    };

    useEffect(() => {
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [
        noteDragStartStep,
        marqueeStartStep,
        noteDrag,
    ]);

    const noteDragMode = noteDrag?.mode ?? hoveredNoteDragMode;

    return (
        <canvas
            style={{
                cursor: pasting
                    ? 'copy'
                    : noteDragMode && !isDragScrolling
                        ? NOTE_DRAG_CURSORS[noteDragMode]
                        : getToolModeCursor(tool, isDragScrolling, marqueeMode),
            }}
            height={height}
            width={width}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            onDoubleClick={onDoubleClick}
            onContextMenu={e => pasting && e.preventDefault()}
            ref={canvasRef}
        />
    );
}
