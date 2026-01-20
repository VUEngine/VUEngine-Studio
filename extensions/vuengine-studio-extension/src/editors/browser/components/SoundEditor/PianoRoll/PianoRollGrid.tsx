import chroma from 'chroma-js';
import React, { Dispatch, MouseEvent, RefObject, SetStateAction, useContext, useEffect, useRef, useState } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';
import { scaleCanvasAccountForDpi } from '../../Common/Utils';
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
    SEQUENCER_RESOLUTION,
    SoundData,
    SoundEvent,
    SUB_NOTE_RESOLUTION,
    TrackSettings
} from '../SoundEditorTypes';
import { getNoteSlideLabel } from '../SoundEditor';

interface PianoRollGridProps {
    soundData: SoundData
    currentTrackId: number
    currentPatternId: string
    currentSequenceIndex: number
    noteCursor: number
    setNoteCursor: (noteCursor: number) => void
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
    setSelectedNotes: Dispatch<SetStateAction<number[]>>
}

export default function PianoRollGrid(props: PianoRollGridProps): React.JSX.Element {
    const {
        soundData,
        currentTrackId,
        currentPatternId,
        currentSequenceIndex,
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

    const songLength = soundData.size / SEQUENCER_RESOLUTION;
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
            const currentPatternSize = currentPattern.size / SEQUENCER_RESOLUTION;
            const highlightColor = services.colorRegistry.getCurrentColor('focusBorder') ?? 'red';
            const mutedHighlightColor = chroma(highlightColor).alpha(0.1).toString();
            context.fillStyle = mutedHighlightColor;
            context.fillRect(
                currentSequenceIndex * NOTE_RESOLUTION / SEQUENCER_RESOLUTION * pianoRollNoteWidth - pianoRollScrollWindow.x - 0.5,
                0,
                currentPatternSize * NOTE_RESOLUTION * pianoRollNoteWidth - 0.5,
                height,
            );
        }

        // highlight current step
        context.fillStyle = highlightMedColor;
        const noteCursorWidth = pianoRollNoteWidth;
        /*
        const currentSequenceIndexStartStep = currentSequenceIndex * SEQUENCER_RESOLUTION * SUB_NOTE_RESOLUTION;
        const currentSequenceIndexEndStep = (currentSequenceIndex + currentPattern.size) * SEQUENCER_RESOLUTION * SUB_NOTE_RESOLUTION;
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
            noteCursorWidth = currentPattern.events[relativeNoteCursor][SoundEvent.Duration] / SUB_NOTE_RESOLUTION * pianoRollNoteWidth;
        }
        */
        context.fillRect(
            noteCursor / SUB_NOTE_RESOLUTION * pianoRollNoteWidth - pianoRollScrollWindow.x,
            0,
            noteCursorWidth - PIANO_ROLL_GRID_WIDTH,
            NOTES_SPECTRUM * pianoRollNoteHeight - PIANO_ROLL_GRID_WIDTH,
        );

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
            Object.keys(track.sequence).forEach(key => {
                const isCurrentTrack = currentTrackId !== undefined && trackId === soundData.tracks.length - 1;
                if (!isCurrentTrack && trackSettings[trackId] !== undefined && !trackSettings[trackId].seeThrough) {
                    return;
                }
                const patternOffset = parseInt(key);
                const patternId = track.sequence[patternOffset];
                const pattern = soundData.patterns[patternId];
                if (!pattern) {
                    return;
                }

                const patternOffsetPx = patternOffset * NOTE_RESOLUTION / SEQUENCER_RESOLUTION * pianoRollNoteWidth;
                const patternWidthPx = pattern.size * NOTE_RESOLUTION / SEQUENCER_RESOLUTION * pianoRollNoteWidth;
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
                        const offset = (patternOffset / SEQUENCER_RESOLUTION * NOTE_RESOLUTION + step / SUB_NOTE_RESOLUTION) * pianoRollNoteWidth - 0.5;
                        const offsetWidth = noteDurationPx / SUB_NOTE_RESOLUTION - PIANO_ROLL_GRID_WIDTH;

                        const noteX = offset + 0.5;
                        const noteY = noteId * pianoRollNoteHeight;
                        const noteWidth = offsetWidth;
                        const noteHeight = pianoRollNoteHeight - PIANO_ROLL_GRID_WIDTH;

                        if (pianoRollScrollWindow.x > noteX + noteWidth || noteX > pianoRollScrollWindow.x + pianoRollScrollWindow.w) {
                            return;
                        }

                        const noteXOffset = noteX - pianoRollScrollWindow.x;

                        if (isCurrentTrack && currentSequenceIndex === parseInt(key)) {
                            const instrumentId = pattern.events[step][SoundEvent.Instrument] ?? track.instrument;
                            const instrument = soundData.instruments[instrumentId];
                            const instrumentColor = COLOR_PALETTE[instrument?.color ?? DEFAULT_COLOR_INDEX];

                            // note slide triangle
                            const noteSlide = pattern.events[step][SoundEvent.NoteSlide];
                            if (noteSlide) {
                                context.fillStyle = instrumentColor;
                                const path = new Path2D();
                                const noteSlideStartY = noteSlide > 0 ? noteY : noteY + noteHeight;
                                const noteSlideEndY = noteSlideStartY - noteSlide * pianoRollNoteHeight;
                                path.moveTo(noteXOffset, noteSlideStartY);
                                path.lineTo(noteXOffset + noteWidth, noteSlideStartY);
                                path.lineTo(noteXOffset + noteWidth, noteSlideEndY);
                                context.fill(path);
                            }

                            // selection outline
                            if (selectedNotes.includes(step)) {
                                context.fillStyle = highlightFullColor;
                                context.fillRect(
                                    noteXOffset - 3,
                                    noteY - 3,
                                    noteWidth + 6,
                                    noteHeight + 6,
                                );
                            }

                            // note rect
                            context.fillStyle = instrumentColor;
                            context.fillRect(
                                noteXOffset,
                                noteY,
                                noteWidth,
                                noteHeight,
                            );

                            // note label
                            if (pianoRollNoteHeight >= PIANO_ROLL_NOTE_HEIGHT_DEFAULT && noteWidth >= PIANO_ROLL_NOTE_WIDTH_DEFAULT - PIANO_ROLL_GRID_WIDTH) {
                                context.fillStyle = chroma.contrast(instrumentColor, 'white') > 2 ? 'white' : 'black';
                                context.font = '10px monospace';
                                context.fillText(getNoteLabel(pattern.events, step), noteXOffset + 2, noteY + 11, noteWidth - 4);
                            }
                        } else {
                            context.fillStyle = isCurrentTrack ? fullColor : lowColor;

                            context.fillRect(
                                noteXOffset,
                                noteY,
                                noteWidth,
                                noteHeight,
                            );
                        }
                    }
                });
            });
        });
    };

    const onMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
        if (e.button === 0) { // Left mouse button
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left + pianoRollScrollWindow.x;
            const y = e.clientY - rect.top;

            const noteId = Math.floor(y / pianoRollNoteHeight);
            const step = Math.floor(x / pianoRollNoteWidth);

            setNoteDragNoteId(noteId);
            setNoteDragStartStep(step);
            setNoteDragEndStep(step + newNoteDuration / SUB_NOTE_RESOLUTION - 1);
        } else if (e.button === 1) { // Middle mouse button
            setIsDragScrolling(true);
        } else if (e.button === 2) { // Right mouse button
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left + pianoRollScrollWindow.x;
            const y = e.clientY - rect.top;

            const noteId = Math.floor(y / pianoRollNoteHeight);
            const step = Math.floor(x / pianoRollNoteWidth);

            const currentPattern = soundData.patterns[currentPatternId];
            const currentSequenceIndexStartStep = currentSequenceIndex * NOTE_RESOLUTION / SEQUENCER_RESOLUTION;
            const currentSequenceIndexEndStep = (currentSequenceIndex + currentPattern.size) * NOTE_RESOLUTION / SEQUENCER_RESOLUTION;

            // if inside current pattern
            if (
                currentPattern &&
                step >= currentSequenceIndexStartStep &&
                step < currentSequenceIndexEndStep
            ) {
                setMarqueeStartStep(step);
                setMarqueeEndStep(step);
                setMarqueeStartNote(noteId);
                setMarqueeEndNote(noteId);
            }
        }
    };

    const onMouseUp = (e: MouseEvent<HTMLCanvasElement>) => {
        if (e.button === 0) { // Left mouse button
            if (noteDragNoteId === -1 || noteDragStartStep === -1 || noteDragEndStep === -1) {
                return;
            }

            const newNoteId = noteDragNoteId;
            const newNoteStep = Math.min(noteDragStartStep, noteDragEndStep);
            const newNoteDur = (Math.abs(noteDragStartStep - noteDragEndStep) + 1) * SUB_NOTE_RESOLUTION;
            const newNoteLabel = NOTES_LABELS[newNoteId];
            const newNoteCursor = newNoteStep * SUB_NOTE_RESOLUTION;

            const currentPattern = soundData.patterns[currentPatternId];
            const currentSequenceIndexStartStep = currentSequenceIndex * NOTE_RESOLUTION / SEQUENCER_RESOLUTION;
            const currentSequenceIndexEndStep = (currentSequenceIndex + currentPattern.size) * NOTE_RESOLUTION / SEQUENCER_RESOLUTION;

            // if inside current pattern
            if (
                currentPattern &&
                newNoteStep >= currentSequenceIndexStartStep &&
                newNoteStep < currentSequenceIndexEndStep
            ) {
                setNotes({
                    [(newNoteStep - currentSequenceIndexStartStep) * SUB_NOTE_RESOLUTION]: {
                        [SoundEvent.Note]: newNoteLabel,
                        [SoundEvent.Duration]: newNoteDur,
                    }
                });
                setNoteCursor(newNoteCursor);
            } else {
                const newPatternSize = Math.abs(noteDragStartStep - noteDragEndStep) + 1;
                setPatternAtCursorPosition(newNoteCursor, newPatternSize);
            }

            // reset
            setNoteDragNoteId(-1);
            setNoteDragStartStep(-1);
            setNoteDragEndStep(-1);
        } else if (e.button === 1) { // Middle mouse button
            setIsDragScrolling(false);
        } else if (e.button === 2) { // Right mouse button
            if (marqueeStartStep === -1 || marqueeEndStep === -1 || marqueeStartNote === -1 || marqueeEndNote === -1) {
                return;
            }

            const sortedMarqueeStartStep = Math.min(marqueeStartStep, marqueeEndStep);
            const sortedMarqueeEndStep = Math.max(marqueeStartStep, marqueeEndStep);
            const sortedMarqueeStartNote = Math.min(marqueeStartNote, marqueeEndNote);
            const sortedMarqueeEndNote = Math.max(marqueeStartNote, marqueeEndNote);

            const currentPattern = soundData.patterns[currentPatternId];
            const currentSequenceIndexStartStep = currentSequenceIndex * NOTE_RESOLUTION / SEQUENCER_RESOLUTION;
            const currentSequenceIndexEndStep = (currentSequenceIndex + currentPattern.size) * NOTE_RESOLUTION / SEQUENCER_RESOLUTION;

            const currentPatternStartStep = currentSequenceIndex * SEQUENCER_RESOLUTION * SUB_NOTE_RESOLUTION;

            // if inside current pattern
            if (
                currentPattern &&
                sortedMarqueeStartStep >= currentSequenceIndexStartStep &&
                sortedMarqueeStartStep < currentSequenceIndexEndStep
            ) {
                const patternRelativeMarqueeStartStep = sortedMarqueeStartStep * SUB_NOTE_RESOLUTION - currentPatternStartStep;
                const patternRelativeMarqueeEndStep = sortedMarqueeEndStep * SUB_NOTE_RESOLUTION - currentPatternStartStep;
                const newSelectedNodes = Object.keys(currentPattern.events)
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

                // add to selected notes with ctrlcmd key
                if (e.metaKey || e.ctrlKey) {
                    setSelectedNotes(prev => [...prev, ...newSelectedNodes]
                        // .filter(item => !(prev.includes(item) && newSelectedNodes.includes(item))) // unselect already selected
                        .filter((item, pos, self) => self.indexOf(item) === pos) // remove double
                        .sort()
                    );
                } else {
                    setSelectedNotes(newSelectedNodes);
                }

                if (newSelectedNodes.length === 0) {
                    setNoteCursor(sortedMarqueeStartStep * SUB_NOTE_RESOLUTION);
                }
            }

            // reset
            setMarqueeStartStep(-1);
            setMarqueeEndStep(-1);
            setMarqueeStartNote(-1);
            setMarqueeEndNote(-1);
        }
    };

    const onMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
        if (isDragScrolling) {
            if (e.movementX > 0 || e.movementY > 0) {
                pianoRollRef.current?.scrollBy({
                    left: -e.movementX,
                    top: -e.movementY,
                });
            }
        } else {
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
            } else if (marqueeStartStep !== -1 && marqueeEndStep !== -1) {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left + pianoRollScrollWindow.x;
                const y = e.clientY - rect.top;

                const noteId = Math.floor(y / pianoRollNoteHeight);
                const step = Math.floor(x / pianoRollNoteWidth);

                if (step !== marqueeEndStep) {
                    const currentPattern = soundData.patterns[currentPatternId];
                    const currentSequenceIndexStartStep = currentSequenceIndex * NOTE_RESOLUTION / SEQUENCER_RESOLUTION;
                    const currentSequenceIndexEndStep = (currentSequenceIndex + currentPattern.size) * NOTE_RESOLUTION / SEQUENCER_RESOLUTION;

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
        }
    };

    const onMouseLeave = (e: MouseEvent<HTMLCanvasElement>) => {
        // setIsDragScrolling(false);
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
