import chroma from 'chroma-js';
import React, { MouseEvent, RefObject, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';
import { clamp, scaleCanvasAccountForDpi } from '../../Common/Utils';
import { drawSongEnd } from '../EffectsPanel/EffectsPanelGridOverview';
import { getNoteMoveChanges } from '../Other/Note';
import { getGridLine, getTimeSignatureSegments } from '../Other/timeSignature';
import { fitNotesToPatterns, getPatternChanges, getPatternPlacementAt, getPatternPlacements, getTrackStepEvents } from '../Other/trackNotes';
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
    setTrackNotes: (notes: EventsMap) => void
    setCurrentSequenceIndex: (trackId: number, sequenceIndex: number) => void
    newNoteDuration: number
    pianoRollNoteHeight: number
    pianoRollNoteWidth: number
    setPatternAtCursorPosition: (cursor?: number, size?: number) => void
    pianoRollScrollWindow: ScrollWindow
    pianoRollRef: RefObject<HTMLDivElement>
    trackSettings: TrackSettings[]
    selectedNotes: number[]
    setSelectedNotes: (sn: number[]) => void
    playNote: (note: string, instrumentId?: string) => void
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

// notes can be edited in all of the current track's patterns, so their steps are counted from the start of the sound
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
        setTrackNotes,
        setCurrentSequenceIndex,
        newNoteDuration,
        pianoRollNoteHeight, pianoRollNoteWidth,
        setPatternAtCursorPosition,
        pianoRollScrollWindow,
        pianoRollRef,
        trackSettings,
        selectedNotes, setSelectedNotes,
        playNote,
        testNote,
        editCurrentNote,
        openSongLengthDialog,
        noteSnapping,
        previewNotes, pasting, setPastePosition, commitPaste, cancelPaste,
    } = props;
    const { currentThemeType, services } = useContext(EditorsContext) as EditorsContextType;
    const [isDragScrolling, setIsDragScrolling] = useState<boolean>(false);
    const [noteDragNoteId, setNoteDragNoteId] = useState<number>(-1);
    const [noteDragStartStep, setNoteDragStartStep] = useState<number>(-1);
    const [noteDragEndStep, setNoteDragEndStep] = useState<number>(-1);
    const [marqueeStartStep, setMarqueeStartStep] = useState<number>(-1);
    const [marqueeEndStep, setMarqueeEndStep] = useState<number>(-1);
    const [marqueeStartNote, setMarqueeStartNote] = useState<number>(-1);
    const [marqueeEndNote, setMarqueeEndNote] = useState<number>(-1);
    const [noteDragInitialX, setNoteDragInitialX] = useState<number>(-1);
    const [noteDrag, setNoteDrag] = useState<NoteDrag>();
    const [hoveredNoteDragMode, setHoveredNoteDragMode] = useState<NoteDragMode>();
    // the click which places pasted notes must not select anything when the mouse button gets released
    const ignoreNextMouseUpRef = useRef<boolean>(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const patternPlacements = useMemo(() => getPatternPlacements(soundData, currentTrackId), [soundData, currentTrackId]);
    const trackEvents = useMemo(() => getTrackStepEvents(patternPlacements), [patternPlacements]);

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

    // while resizing or sliding, the notes get drawn as they would become, in all placements of their patterns
    const noteDragOverrides = noteDrag?.mode !== 'move' && noteDrag?.changes
        ? getPatternChanges(patternPlacements, noteDrag.changes)
        : undefined;
    const getDrawnEvents = (patternId: string, events: EventsMap): EventsMap => {
        const overrides = noteDragOverrides?.[patternId];
        return overrides
            ? {
                ...events,
                ...Object.fromEntries(Object.keys(overrides).map(step => [step, {
                    ...events[parseInt(step)],
                    ...overrides[parseInt(step)],
                }])),
            }
            : events;
    };

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

        // highlight note cursor and, if on a note, the note's duration
        if (soundData.tracks[currentTrackId] !== undefined) {
            const noteAtCursor = trackEvents[noteCursor];
            if (noteAtCursor?.[SoundEvent.Note] !== undefined && noteAtCursor[SoundEvent.Duration] !== undefined) {
                context.fillStyle = highlightLowColor;
                context.fillRect(
                    noteCursor / SUB_NOTE_RESOLUTION * pianoRollNoteWidth - pianoRollScrollWindow.x,
                    0,
                    noteAtCursor[SoundEvent.Duration] / SUB_NOTE_RESOLUTION * pianoRollNoteWidth - PIANO_ROLL_GRID_WIDTH,
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
                const events = isCurrentTrack
                    ? getDrawnEvents(patternId, pattern.events)
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
                        if (isCurrentTrack && selectedNotes.includes(patternSi * SUB_NOTE_RESOLUTION + step)) {
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
        if (ghostNotes) {
            const track = soundData.tracks[currentTrackId];
            Object.keys(ghostNotes).forEach(stepStr => {
                const step = parseInt(stepStr);
                const events = ghostNotes[step];
                const noteId = NOTES_LABELS.indexOf(events[SoundEvent.Note]);
                const noteX = step / SUB_NOTE_RESOLUTION * pianoRollNoteWidth - pianoRollScrollWindow.x;
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

        // note being placed
        if (noteDragNoteId > -1 && noteDragStartStep > -1 && noteDragEndStep > -1) {
            context.strokeStyle = highlightFullColor;
            context.lineWidth = 1;
            context.setLineDash([3, 2]);
            context.strokeRect(
                Math.min(noteDragStartStep, noteDragEndStep) * pianoRollNoteWidth - pianoRollScrollWindow.x + 0.5,
                noteDragNoteId * pianoRollNoteHeight + 0.5,
                (Math.abs(noteDragStartStep - noteDragEndStep) + 1) * pianoRollNoteWidth - 1,
                pianoRollNoteHeight - 1,
            );
            context.setLineDash([]);
        }

        // select marquee
        if (marqueeStartStep > -1 && marqueeEndStep > -1 && marqueeStartNote > -1 && marqueeEndNote > -1) {
            const marqueeLeft = Math.min(marqueeStartStep, marqueeEndStep) * pianoRollNoteWidth - pianoRollScrollWindow.x;
            const marqueeTop = Math.min(marqueeStartNote, marqueeEndNote) * pianoRollNoteHeight;
            const marqueeWidth = (Math.abs(marqueeStartStep - marqueeEndStep) + 1) * pianoRollNoteWidth;
            const marqueeHeight = (Math.abs(marqueeStartNote - marqueeEndNote) + 1) * pianoRollNoteHeight;

            context.fillStyle = highlightLowColor;
            context.fillRect(marqueeLeft, marqueeTop, marqueeWidth, marqueeHeight);
            context.strokeStyle = highlightFullColor;
            context.lineWidth = 1;
            context.setLineDash([3, 2]);
            context.strokeRect(marqueeLeft - 0.5, marqueeTop - 0.5, marqueeWidth, marqueeHeight);
            context.setLineDash([]);
        }

        drawSongEnd(context, currentThemeType, soundData.size * pianoRollNoteWidth, pianoRollScrollWindow.x, width, height);
    };

    // while pasting, the first copied note follows the mouse, snapped to whole 1/16 notes with snapping
    const updatePastePosition = (e: MouseEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left + pianoRollScrollWindow.x;
        const y = e.clientY - rect.top;
        const step = noteSnapping
            ? Math.floor(x / pianoRollNoteWidth) * SUB_NOTE_RESOLUTION
            : Math.floor(x * SUB_NOTE_RESOLUTION / pianoRollNoteWidth);
        setPastePosition({
            step: Math.min(Math.max(0, step), soundData.size * SUB_NOTE_RESOLUTION - 1),
            noteId: Math.floor(y / pianoRollNoteHeight),
        });
    };

    // editing another pattern of the current track makes it the current one first, returns whether it did
    const switchToPattern = (sequenceIndex: number): boolean => {
        if (sequenceIndex === currentSequenceIndex) {
            return false;
        }
        setCurrentSequenceIndex(currentTrackId, sequenceIndex);
        return true;
    };

    const findNoteStep = (events: EventsMap, step: number, noteId: number): number => {
        let slideResult = -1;
        for (const s of Object.keys(events)) {
            const sInt = parseInt(s);
            const stepEvents = events[sInt];
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

    // the note at the given position, by its step from the start of the sound, or -1
    const findNoteAt = (x: number, y: number): number =>
        findNoteStep(trackEvents, x * SUB_NOTE_RESOLUTION / pianoRollNoteWidth, Math.floor(y / pianoRollNoteHeight));

    // notes get resized at their right edge, slid at their top and bottom edges or by their slide triangle,
    // and moved anywhere else
    const getNoteHit = (x: number, y: number): NoteHit | undefined => {
        const step = findNoteAt(x, y);
        if (step === -1) {
            return;
        }

        const events = trackEvents[step];
        const noteY = NOTES_LABELS.indexOf(events[SoundEvent.Note]) * pianoRollNoteHeight;
        if (y < noteY || y >= noteY + pianoRollNoteHeight) {
            return { step, mode: 'slide' };
        }

        const noteWidth = events[SoundEvent.Duration] * pianoRollNoteWidth / SUB_NOTE_RESOLUTION - PIANO_ROLL_GRID_WIDTH;
        const noteRight = step / SUB_NOTE_RESOLUTION * pianoRollNoteWidth + noteWidth;
        if (noteWidth >= 8 && x >= noteRight - Math.min(6, noteWidth / 4)) {
            return { step, mode: 'duration' };
        }

        const slideEdge = Math.min(3, Math.floor(pianoRollNoteHeight / 5));
        if (pianoRollNoteHeight >= 10 && (y < noteY + slideEdge || y >= noteY + pianoRollNoteHeight - PIANO_ROLL_GRID_WIDTH - slideEdge)) {
            return { step, mode: 'slide' };
        }

        return { step, mode: 'move' };
    };

    // notes end with their pattern at the latest, and get cut off by the next note
    const getMaxNoteDuration = (step: number): number => {
        const placement = getPatternPlacementAt(patternPlacements, step);
        const nextNoteStep = Object.keys(trackEvents)
            .map(s => parseInt(s))
            .find(s => s > step && trackEvents[s][SoundEvent.Note] !== undefined);

        return Math.min(placement?.endStep ?? step, nextNoteStep ?? Infinity) - step;
    };

    // with the marquee tool, only selected notes can be grabbed, as clicking elsewhere starts a marquee
    const isGrabbable = (hit: NoteHit): boolean =>
        tool === SoundEditorTool.EDIT ||
        tool === SoundEditorTool.MARQUEE && marqueeMode === SoundEditorMarqueeMode.REPLACE && selectedNotes.includes(hit.step);

    // undefined if the notes cannot be moved there, as they would not fit into patterns
    const getNoteDragChanges = (drag: NoteDrag, x: number, y: number): { changes: EventsMap, stepOffset: number } | undefined => {
        const events = trackEvents;
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
                    Math.max(0, soundData.size * SUB_NOTE_RESOLUTION - Math.max(...steps.map(step => step + (events[step][SoundEvent.Duration] ?? 0))))
                );
                const noteIds = steps.map(step => NOTES_LABELS.indexOf(events[step][SoundEvent.Note]));
                const noteOffset = clamp(deltaNotes, -Math.min(...noteIds), NOTES_SPECTRUM - 1 - Math.max(...noteIds));

                // the notes can move into other patterns, but not into gaps between them
                if (steps.some(step => getPatternPlacementAt(patternPlacements, step + stepOffset) === undefined)) {
                    return undefined;
                }
                if (stepOffset === 0 && noteOffset === 0) {
                    return { changes: {}, stepOffset };
                }

                // notes reaching beyond the end of the pattern they get moved into get cut off there
                const moveChanges = getNoteMoveChanges(events, steps, soundData.size, stepOffset, noteOffset);
                const movedNotes = Object.fromEntries(Object.entries(moveChanges).filter(([step, e]) => e[SoundEvent.Note] !== undefined));

                return {
                    changes: { ...moveChanges, ...fitNotesToPatterns(patternPlacements, movedNotes) },
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
                        Math.max(duration, getMaxNoteDuration(step))
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

    // clicking a note selects it and grabs it, together with all other selected notes, which can be in all of the current
    // track's patterns. The clicked note's pattern becomes the current one.
    const handleMouseDownNote = (e: MouseEvent<HTMLCanvasElement>): boolean => {
        if (tool !== SoundEditorTool.EDIT && tool !== SoundEditorTool.MARQUEE) {
            return false;
        }
        const { x, y } = getMousePosition(e);
        const hit = getNoteHit(x, y);
        if (!hit || !isGrabbable(hit)) {
            return false;
        }
        // with modifiers, right clicking deletes the note on mouse up instead
        if (e.button !== 0 && (e.button !== 2 || tool !== SoundEditorTool.EDIT || e.metaKey || e.ctrlKey || e.altKey)) {
            return false;
        }

        const selection = selectedNotes;
        if (e.button === 2) {
            setSelectedNotes(selection.includes(hit.step)
                ? selection.filter(sn => sn !== hit.step)
                : [...selection, hit.step]);
            return true;
        }

        let steps = selection;
        if (tool === SoundEditorTool.EDIT) {
            if (e.metaKey || e.ctrlKey) {
                if (selection.includes(hit.step)) {
                    setSelectedNotes(selection.filter(sn => sn !== hit.step));
                    return true;
                }
                steps = [...selection, hit.step];
            } else {
                const placement = getPatternPlacementAt(patternPlacements, hit.step);
                if (placement) {
                    switchToPattern(placement.sequenceIndex);
                }
                setCurrentInstrumentId(trackEvents[hit.step][SoundEvent.Instrument] ?? TRACK_DEFAULT_INSTRUMENT_ID);
                if (!selection.includes(hit.step)) {
                    steps = [hit.step];
                }
                setNoteCursor(hit.step);
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
            const result = getNoteDragChanges(noteDrag, x, y);
            if (!result) {
                return;
            }
            const { changes, stepOffset } = result;
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
            setTrackNotes(changes);
            if (noteDrag.mode === 'move') {
                setSelectedNotes(Object.keys(changes)
                    .map(n => parseInt(n))
                    .filter(n => changes[n][SoundEvent.Note] !== undefined));
                // the pattern the grabbed note got moved into becomes the current one
                const newStep = noteDrag.step + (noteDrag.stepOffset ?? 0);
                const placement = getPatternPlacementAt(patternPlacements, newStep);
                if (placement) {
                    switchToPattern(placement.sequenceIndex);
                }
                setNoteCursor(newStep);
            }
        }

        return true;
    };

    const resetNoteDrag = () => {
        if (testNote) {
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

            if (findNoteAt(x, y) === -1) {
                setNoteDragNoteId(noteId);
                setNoteDragStartStep(step);
                setNoteDragInitialX(e.clientX);
                setNoteDragEndStep(step + newNoteDuration - 1);

                if (getPatternPlacementAt(patternPlacements, step * SUB_NOTE_RESOLUTION)) {
                    playNote(NOTES_LABELS[noteId], newNoteInstrumentId);
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

            // inside any of the current track's patterns, which then becomes the current one
            const placement = getPatternPlacementAt(patternPlacements, newNoteCursor);
            if (placement) {
                const stepEvents: SoundEventMap = {
                    [SoundEvent.Note]: newNoteLabel,
                    // the note ends with its pattern at the latest
                    [SoundEvent.Duration]: Math.min(newNoteDur, placement.endStep - newNoteCursor),
                };

                if (currentInstrumentId && currentInstrumentId !== TRACK_DEFAULT_INSTRUMENT_ID) {
                    stepEvents[SoundEvent.Instrument] = currentInstrumentId;
                }

                switchToPattern(placement.sequenceIndex);
                setTrackNotes({ [newNoteCursor]: stepEvents });
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
            const foundStep = findNoteAt(x, y);
            if (foundStep > -1 && (
                tool === SoundEditorTool.ERASER && e.button === 0 ||
                (e.metaKey || e.ctrlKey || e.altKey) && e.button === 2
            )) {
                setTrackNotes({ [foundStep]: {} });
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

            // the marquee can span all of the current track's patterns, the one it starts in becomes the current one
            const placement = getPatternPlacementAt(patternPlacements, step * SUB_NOTE_RESOLUTION);
            if (placement) {
                switchToPattern(placement.sequenceIndex);
            }
            setMarqueeStartStep(step);
            setMarqueeEndStep(step);
            setMarqueeStartNote(noteId);
            setMarqueeEndNote(noteId);
        }
    };

    const handleMouseMoveMarquee = (e: MouseEvent<HTMLCanvasElement>) => {
        if (marqueeStartStep !== -1 && marqueeEndStep !== -1) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left + pianoRollScrollWindow.x;
            const y = e.clientY - rect.top;

            const noteId = Math.floor(y / pianoRollNoteHeight);
            const step = Math.floor(x / pianoRollNoteWidth);

            if (step !== marqueeEndStep || noteId !== marqueeEndNote) {
                setMarqueeEndStep(step);
                setMarqueeEndNote(noteId);
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

            const marqueeStartSubStep = sortedMarqueeStartStep * SUB_NOTE_RESOLUTION;
            const marqueeEndSubStep = (sortedMarqueeEndStep + 1) * SUB_NOTE_RESOLUTION;
            const newSelectedNotes = Object.keys(trackEvents)
                .map(n => parseInt(n))
                .filter(eventStep => {
                    const noteId = NOTES_LABELS.indexOf(trackEvents[eventStep][SoundEvent.Note]);
                    return noteId >= sortedMarqueeStartNote &&
                        noteId <= sortedMarqueeEndNote &&
                        eventStep < marqueeEndSubStep &&
                        eventStep + (trackEvents[eventStep][SoundEvent.Duration] ?? 1) > marqueeStartSubStep;
                });

            if (marqueeMode === SoundEditorMarqueeMode.ADD) {
                setSelectedNotes([...selectedNotes, ...newSelectedNotes.filter(item => !selectedNotes.includes(item))]);
            } else if (marqueeMode === SoundEditorMarqueeMode.SUBTRACT) {
                setSelectedNotes(selectedNotes.filter(item => !newSelectedNotes.includes(item)));
            } else if (marqueeMode === SoundEditorMarqueeMode.REPLACE) {
                setSelectedNotes(newSelectedNotes);
            }

            if (newSelectedNotes.length === 0) {
                setNoteCursor(marqueeStartSubStep);
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
        if (findNoteAt(x, y) > -1) {
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
        noteDragNoteId,
        noteDragStartStep,
        noteDragEndStep,
        marqueeStartStep,
        marqueeEndStep,
        marqueeStartNote,
        marqueeEndNote,
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
