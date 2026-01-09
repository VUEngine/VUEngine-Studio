import chroma from 'chroma-js';
import React, { Dispatch, RefObject, SetStateAction, useContext, useEffect, useRef, useState } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';
import { scaleCanvasAccountForDpi } from '../../Common/Utils';
import { SetNoteProps } from '../SoundEditor';
import {
    NOTE_RESOLUTION,
    NOTES_LABELS,
    NOTES_PER_OCTAVE,
    NOTES_SPECTRUM,
    PIANO_ROLL_GRID_WIDTH,
    ScrollWindow,
    SEQUENCER_RESOLUTION,
    SoundData,
    SoundEvent,
    SUB_NOTE_RESOLUTION,
    TrackSettings
} from '../SoundEditorTypes';

interface PianoRollGridProps {
    soundData: SoundData
    currentTrackId: number
    currentPatternId: string
    currentSequenceIndex: number
    noteCursor: number
    setNoteCursor: (noteCursor: number) => void
    setNote: (notes: SetNoteProps[]) => void
    pianoRollNoteHeight: number
    pianoRollNoteWidth: number
    setPatternAtCursorPosition: (cursor?: number, size?: number) => Promise<boolean>
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
    pianoRollScrollWindow: ScrollWindow
    pianoRollRef: RefObject<HTMLDivElement>
    trackSettings: TrackSettings[]
    setSelectedNotes: Dispatch<SetStateAction<number[]>>
}

export default function PianoRollGrid(props: PianoRollGridProps): React.JSX.Element {
    const {
        soundData,
        currentTrackId,
        currentPatternId,
        currentSequenceIndex,
        noteCursor, setNoteCursor,
        setNote,
        pianoRollNoteHeight, pianoRollNoteWidth,
        setPatternAtCursorPosition,
        noteDragNoteId: dragNoteId, setNoteDragNoteId: setDragNoteId,
        noteDragStartStep: dragStartStep, setNoteDragStartStep: setDragStartStep,
        noteDragEndStep: dragEndStep, setNoteDragEndStep: setDragEndStep,
        marqueeStartStep, setMarqueeStartStep,
        marqueeEndStep, setMarqueeEndStep,
        pianoRollScrollWindow,
        pianoRollRef,
        trackSettings,
        setSelectedNotes,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const [isDragScrolling, setIsDragScrolling] = useState<boolean>(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const songLength = soundData.size / SEQUENCER_RESOLUTION;
    const height = NOTES_SPECTRUM * pianoRollNoteHeight;
    const width = Math.min(
        pianoRollScrollWindow.w,
        songLength * NOTE_RESOLUTION * pianoRollNoteWidth
    );

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

        const themeType = services.themeService.getCurrentTheme().type;
        const highContrastTheme = ['hc', 'hcLight'].includes(themeType);
        const c = ['light', 'hcLight'].includes(themeType) ? 0 : 255;
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
        const w = canvas.width;
        const h = canvas.height;

        // highlight current step
        if (!highContrastTheme) {
            context.fillStyle = lowColor;
            context.fillRect(
                noteCursor / SUB_NOTE_RESOLUTION * pianoRollNoteWidth - pianoRollScrollWindow.x - 0.5,
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
            context.lineTo(offset, h);
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
            context.lineTo(w, offset);
            context.strokeStyle = y % NOTES_PER_OCTAVE === 0
                ? hiColor
                : medColor;
            context.stroke();

            // sharp note background
            if (NOTES_LABELS[y].includes('#') && !highContrastTheme) {
                context.fillStyle = themeType === 'light'
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
                h,
            );
        }

        // notes
        soundData.tracks.map((track, trackId) => {
            Object.keys(track.sequence).forEach(key => {
                if (trackId !== currentTrackId && trackSettings[trackId] !== undefined && !trackSettings[trackId].seeThrough) {
                    return;
                }
                const patternOffset = parseInt(key);
                const patternId = track.sequence[patternOffset];
                const pattern = soundData.patterns[patternId];
                if (!pattern) {
                    return;
                }
                Object.keys(pattern.events).map(stepStr => {
                    const step = parseInt(stepStr);
                    const noteLabel = pattern.events[step][SoundEvent.Note] ?? '';
                    if (noteLabel !== undefined && noteLabel !== null && noteLabel !== '') {
                        const noteDurationPx = (pattern.events[step][SoundEvent.Duration] ?? 1) * pianoRollNoteWidth;
                        if (patternOffset + noteDurationPx < pianoRollScrollWindow.x || patternOffset > pianoRollScrollWindow.x + pianoRollScrollWindow.w) {
                            return;
                        }
                        const noteId = NOTES_LABELS.indexOf(noteLabel);
                        const offset = (patternOffset / SEQUENCER_RESOLUTION * NOTE_RESOLUTION + step / SUB_NOTE_RESOLUTION) * pianoRollNoteWidth - pianoRollScrollWindow.x - 0.5;
                        const offsetWidth = noteDurationPx / SUB_NOTE_RESOLUTION - PIANO_ROLL_GRID_WIDTH;

                        const instrumentId = pattern.events[step][SoundEvent.Instrument] ?? track.instrument;
                        const instrument = soundData.instruments[instrumentId];
                        const instrumentColor = COLOR_PALETTE[instrument?.color ?? DEFAULT_COLOR_INDEX];

                        context.fillStyle = trackId === currentTrackId
                            ? currentSequenceIndex === parseInt(key)
                                ? instrumentColor
                                : fullColor
                            : lowColor;
                        context.fillRect(
                            offset + 0.5,
                            noteId * pianoRollNoteHeight,
                            offsetWidth,
                            pianoRollNoteHeight - PIANO_ROLL_GRID_WIDTH,
                        );
                    }
                });
            });
        });
    };

    const onMouseDown = (e: React.MouseEvent<HTMLElement>) => {
        if (e.button === 0) { // Left mouse button
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left + pianoRollScrollWindow.x;
            const y = e.clientY - rect.top;

            const noteId = Math.floor(y / pianoRollNoteHeight);
            const step = Math.floor(x / pianoRollNoteWidth);

            setDragNoteId(noteId);
            setDragStartStep(step);
            setDragEndStep(step);
        } else if (e.button === 1) { // Middle mouse button
            setIsDragScrolling(true);
        } else if (e.button === 2) { // Right mouse button
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left + pianoRollScrollWindow.x;
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
            }
        }
    };

    const onMouseUp = async (e: React.MouseEvent<HTMLElement>) => {
        if (e.button === 0) { // Left mouse button
            if (dragNoteId === -1 || dragStartStep === -1 || dragEndStep === -1) {
                return;
            }

            const newNoteId = dragNoteId;
            const newNoteStep = Math.min(dragStartStep, dragEndStep);
            const newNoteDurationSteps = (Math.abs(dragStartStep - dragEndStep) + 1);
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
                setNote([{
                    step: (newNoteStep - currentSequenceIndexStartStep) * SUB_NOTE_RESOLUTION,
                    note: newNoteLabel,
                    prevStep: undefined,
                    duration: newNoteDurationSteps * SUB_NOTE_RESOLUTION
                }]);
                setNoteCursor(newNoteCursor);
            } else {
                const newPatternSize = Math.abs(dragStartStep - dragEndStep) + 1;
                if (await setPatternAtCursorPosition(newNoteCursor, newPatternSize)) {
                    setNoteCursor(newNoteCursor);
                }
            }

            // reset
            setDragNoteId(-1);
            setDragStartStep(-1);
            setDragEndStep(-1);
        } else if (e.button === 1) { // Middle mouse button
            setIsDragScrolling(false);
        } else if (e.button === 2) { // Right mouse button
            if (marqueeStartStep === -1 || marqueeEndStep === -1) {
                return;
            }

            const sortedMarqueeStartStep = Math.min(marqueeStartStep, marqueeEndStep);
            const sortedMarqueeEndStep = Math.max(marqueeStartStep, marqueeEndStep);

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
                        eventStep >= patternRelativeMarqueeStartStep &&
                        eventStep <= patternRelativeMarqueeEndStep
                    );
                setSelectedNotes(newSelectedNodes);
            }

            // reset
            setMarqueeStartStep(-1);
            setMarqueeEndStep(-1);
        }
    };

    const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
        if (isDragScrolling) {
            if (e.movementX > 0 || e.movementY > 0) {
                pianoRollRef.current?.scrollBy({
                    left: -e.movementX,
                    top: -e.movementY,
                });
            }
        } else {
            if (dragNoteId !== -1 && dragStartStep !== -1 && dragEndStep !== -1) {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left + pianoRollScrollWindow.x;
                const y = e.clientY - rect.top;

                const noteId = Math.floor(y / pianoRollNoteHeight);
                const step = Math.floor(x / pianoRollNoteWidth);

                if (noteId !== dragNoteId) {
                    setDragNoteId(noteId);
                }
                if (step !== dragEndStep) {
                    setDragEndStep(step);
                }
            } else if (marqueeStartStep !== -1 && marqueeEndStep !== -1) {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left + pianoRollScrollWindow.x;
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
                    }
                }
            }
        }
    };

    const onMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
        // setIsDragScrolling(false);
    };

    useEffect(() => {
        draw();

        // TODO
        /*
        const watcher = services.themeService.onDidColorThemeChange(() => draw());
        return watcher.dispose();
        */
    }, [
        soundData,
        currentTrackId,
        currentPatternId,
        currentSequenceIndex,
        noteCursor,
        pianoRollNoteHeight,
        pianoRollNoteWidth,
        pianoRollScrollWindow.x,
        pianoRollScrollWindow.w,
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
