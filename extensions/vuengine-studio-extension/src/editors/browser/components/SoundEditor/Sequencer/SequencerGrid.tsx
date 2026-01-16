import React, { Dispatch, MouseEvent, SetStateAction, useContext, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { scaleCanvasAccountForDpi } from '../../Common/Utils';
import {
    DEFAULT_PLAY_RANGE_SIZE,
    NOTE_RESOLUTION,
    NOTES_LABELS,
    NOTES_SPECTRUM,
    SCROLL_BAR_WIDTH,
    ScrollWindow,
    SEQUENCER_GRID_METER_HEIGHT,
    SEQUENCER_GRID_WIDTH,
    SEQUENCER_NOTE_HEIGHT,
    SEQUENCER_RESOLUTION,
    SoundData,
    SoundEvent,
    SUB_NOTE_RESOLUTION,
} from '../SoundEditorTypes';
import { getPatternName } from '../SoundEditor';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';

const StyledCanvas = styled.canvas`
    cursor: crosshair;
    left: 0;
    position: sticky;
    z-index: 1;
`;

interface SequencerGridProps {
    soundData: SoundData
    currentTrackId: number
    currentPatternId: string
    currentSequenceIndex: number
    addPattern: (trackId: number, bar: number, size?: number) => void
    playRangeStart: number
    setPlayRangeStart: (playRangeStart: number) => void
    playRangeEnd: number
    setPlayRangeEnd: (playRangeEnd: number) => void
    sequencerPatternHeight: number
    sequencerPatternWidth: number
    patternDragTrackId: number
    setPatternDragTrackId: Dispatch<SetStateAction<number>>
    patternDragStartStep: number
    setPatternDragStartStep: Dispatch<SetStateAction<number>>
    patternDragEndStep: number
    setPatternDragEndStep: Dispatch<SetStateAction<number>>
    sequencerScrollWindow: ScrollWindow
    rangeDragStartStep: number
    setRangeDragStartStep: Dispatch<SetStateAction<number>>
    rangeDragEndStep: number
    setRangeDragEndStep: Dispatch<SetStateAction<number>>
    setCurrentPlayerPosition: Dispatch<SetStateAction<number>>
    setForcePlayerRomRebuild: Dispatch<SetStateAction<number>>
}

export default function SequencerGrid(props: SequencerGridProps): React.JSX.Element {
    const {
        soundData,
        currentTrackId,
        currentPatternId,
        currentSequenceIndex,
        addPattern,
        playRangeStart, setPlayRangeStart,
        playRangeEnd, setPlayRangeEnd,
        sequencerPatternHeight, sequencerPatternWidth,
        patternDragTrackId, setPatternDragTrackId,
        patternDragStartStep, setPatternDragStartStep,
        patternDragEndStep, setPatternDragEndStep,
        sequencerScrollWindow,
        rangeDragStartStep, setRangeDragStartStep,
        rangeDragEndStep, setRangeDragEndStep,
        setCurrentPlayerPosition,
        setForcePlayerRomRebuild,
    } = props;
    const { currentThemeType, services } = useContext(EditorsContext) as EditorsContextType;
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const songLength = soundData.size / SEQUENCER_RESOLUTION;
    const height = soundData.tracks.length * sequencerPatternHeight + SEQUENCER_GRID_METER_HEIGHT;
    const width = Math.min(
        sequencerScrollWindow.w - SCROLL_BAR_WIDTH,
        songLength * sequencerPatternWidth
    );

    const patternNoteWidth = sequencerPatternWidth / NOTE_RESOLUTION;
    const noteHeightOverlap = (SEQUENCER_NOTE_HEIGHT - 1) / 2;

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
        const c = currentThemeType === 'light' ? 0 : 255;
        const highlightColor = services.colorRegistry.getCurrentColor('focusBorder')!;
        const patternBackgroundColor = services.colorRegistry.getCurrentColor('secondaryButton.background')!;
        const patternForegroundColor = services.colorRegistry.getCurrentColor('secondaryButton.foreground')!;
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
        const strongColor = highContrastTheme
            ? fullColor
            : `rgba(${c}, ${c}, ${c}, .6)`;

        context.strokeStyle = medColor;
        context.lineWidth = 1;
        context.font = '9px monospace';

        // highlight current track
        context.rect(
            0,
            SEQUENCER_GRID_METER_HEIGHT + currentTrackId * sequencerPatternHeight,
            width,
            sequencerPatternHeight - 1
        );
        context.fillStyle = lowColor;
        context.fill();

        // play range
        if (playRangeStart > -1 && playRangeEnd > -1) {
            context.strokeStyle = services.colorRegistry.getCurrentColor('focusBorder')!;
            context.fillStyle = context.strokeStyle;
            const leftOffset = playRangeStart * sequencerPatternWidth / NOTE_RESOLUTION - sequencerScrollWindow.x - 0.5;
            const rightOffset = playRangeEnd * sequencerPatternWidth / NOTE_RESOLUTION - sequencerScrollWindow.x - 0.5;

            context.beginPath();
            context.moveTo(leftOffset, 0.5);
            context.lineTo(rightOffset, 0.5);
            context.stroke();

            context.beginPath();
            context.moveTo(leftOffset, 0.5);
            context.lineTo(leftOffset, 0.5 + SEQUENCER_GRID_METER_HEIGHT / 2);
            context.lineTo(leftOffset + SEQUENCER_GRID_METER_HEIGHT / 2, 0.5);
            context.fill();

            context.beginPath();
            context.moveTo(rightOffset, 0.5);
            context.lineTo(rightOffset, 0.5 + SEQUENCER_GRID_METER_HEIGHT / 2);
            context.lineTo(rightOffset - SEQUENCER_GRID_METER_HEIGHT / 2, 0.5);
            context.fill();
        }

        // vertical lines
        for (let x = 0; x <= soundData.size; x++) {
            const lineX = x * sequencerPatternWidth / SEQUENCER_RESOLUTION - 0.5;
            if (lineX < sequencerScrollWindow.x) {
                continue;
            }
            if (lineX > sequencerScrollWindow.x + sequencerScrollWindow.w) {
                break;
            }

            const offset = lineX - sequencerScrollWindow.x;
            context.beginPath();
            context.moveTo(offset, x % (4 * SEQUENCER_RESOLUTION) ? SEQUENCER_GRID_METER_HEIGHT : 0);
            context.lineTo(offset, height);
            context.strokeStyle = x === soundData.size
                ? strongColor
                : x % (4 * SEQUENCER_RESOLUTION) === 0
                    ? hiColor
                    : x % SEQUENCER_RESOLUTION === 0
                        ? medColor
                        : lowColor;
            context.stroke();

            // meter numbers
            if ((x / SEQUENCER_RESOLUTION) % 4 === 0) {
                context.fillStyle = hiColor;
                context.fillText((x / SEQUENCER_RESOLUTION).toString(), offset + 3, 10);
            }
        }

        // horizontal lines
        for (let y = 0; y <= soundData.tracks.length; y++) {
            const offset = SEQUENCER_GRID_METER_HEIGHT + y * sequencerPatternHeight - 0.5;
            context.beginPath();
            context.moveTo(0, offset);
            context.lineTo(width, offset);
            context.strokeStyle = y % soundData.tracks.length === 0
                ? strongColor
                : hiColor;
            context.stroke();
        }

        // patterns
        {
            soundData.tracks.forEach((track, trackId) =>
                Object.keys(track.sequence).forEach(key => {
                    const step = parseInt(key);
                    const patternId = track.sequence[step];
                    const pattern = soundData.patterns[patternId];
                    if (!pattern) {
                        return;
                    }

                    const patternX = step / SEQUENCER_RESOLUTION * sequencerPatternWidth;
                    const patternWidth = pattern.size / SEQUENCER_RESOLUTION * sequencerPatternWidth - SEQUENCER_GRID_WIDTH;

                    if (sequencerScrollWindow.x > patternX + patternWidth || patternX > sequencerScrollWindow.x + sequencerScrollWindow.w) {
                        return;
                    }

                    const patternXOffset = patternX - sequencerScrollWindow.x;
                    const patternY = SEQUENCER_GRID_METER_HEIGHT + trackId * sequencerPatternHeight;
                    const patternHeight = sequencerPatternHeight - SEQUENCER_GRID_WIDTH;

                    // pattern background
                    if (trackId === currentTrackId && step === currentSequenceIndex) {
                        context.fillStyle = highlightColor;
                    } else {
                        context.fillStyle = patternBackgroundColor;
                    }
                    context.fillRect(patternXOffset, patternY, patternWidth, patternHeight);

                    // pattern border
                    if (patternId === currentPatternId) {
                        context.strokeStyle = highlightColor;
                        context.beginPath();
                        context.moveTo(patternXOffset, patternY);
                        context.lineTo(patternXOffset + patternWidth, patternY);
                        context.lineTo(patternXOffset + patternWidth, patternY + patternHeight);
                        context.lineTo(patternXOffset, patternY + patternHeight);
                        context.lineTo(patternXOffset, patternY);
                        context.stroke();
                    }

                    // pattern notes
                    const trackDefaultInstrument = soundData.instruments[track.instrument];
                    const defaultColor = COLOR_PALETTE[trackDefaultInstrument?.color ?? DEFAULT_COLOR_INDEX];
                    Object.keys(pattern.events).forEach((eventKey: string) => {
                        const s = parseInt(eventKey);
                        const event = pattern.events[s];
                        const noteLabel = event[SoundEvent.Note];
                        if (noteLabel) {
                            const instrumentId = event[SoundEvent.Instrument];
                            const color = instrumentId
                                ? COLOR_PALETTE[soundData.instruments[instrumentId].color ?? DEFAULT_COLOR_INDEX]
                                : defaultColor;
                            const noteId = NOTES_LABELS.indexOf(noteLabel);
                            const duration = event[SoundEvent.Duration]
                                ? Math.floor(event[SoundEvent.Duration] / SUB_NOTE_RESOLUTION)
                                : 1;
                            const noteXPosition = Math.floor(s / SUB_NOTE_RESOLUTION) * patternNoteWidth;
                            const noteYPosition = Math.floor(((sequencerPatternHeight - SEQUENCER_NOTE_HEIGHT) / NOTES_SPECTRUM * noteId)
                                - (SEQUENCER_NOTE_HEIGHT / 2)) + noteHeightOverlap;
                            context.fillStyle = color;
                            context.fillRect(
                                patternXOffset + noteXPosition,
                                patternY + noteYPosition,
                                duration * patternNoteWidth,
                                SEQUENCER_NOTE_HEIGHT
                            );
                        }
                    });

                    // pattern name
                    context.fillStyle = patternForegroundColor;
                    const patternName = pattern.size >= 4
                        ? getPatternName(soundData, patternId)
                        : '…';
                    context.fillText(patternName, patternXOffset + 3, patternY + 10, patternWidth - 6);
                })
            );
        }
    };

    const onMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left + sequencerScrollWindow.x;
        const y = e.clientY - rect.top;

        if (y < SEQUENCER_GRID_METER_HEIGHT) {
            if (e.button === 0) { // Left mouse button
                const step = Math.floor(x / sequencerPatternWidth * SEQUENCER_RESOLUTION * SEQUENCER_RESOLUTION);
                if (e.button === 0) {
                    setRangeDragStartStep(step);
                    setRangeDragEndStep(step);
                    setPlayRangeStart(-1);
                    setPlayRangeEnd(-1);
                }
            }
        } else {
            if (e.button === 0) { // Left mouse button
                const trackId = Math.floor((y - SEQUENCER_GRID_METER_HEIGHT) / sequencerPatternHeight);
                const step = Math.floor(x / (sequencerPatternWidth / SEQUENCER_RESOLUTION));

                setPatternDragTrackId(trackId);
                setPatternDragStartStep(step);
                setPatternDragEndStep(step);
            } else if (e.button === 2) { // Right mouse button
                // TODO: marquee and multi pattern select
            }
        }
    };

    const onMouseUp = (e: MouseEvent<HTMLCanvasElement>) => {
        if (e.button === 0) { // Left mouse button
            if (patternDragTrackId !== -1 && patternDragStartStep !== -1 && patternDragEndStep !== -1) {
                const newPatternStep = Math.min(patternDragStartStep, patternDragEndStep);
                const newPatternSize = Math.abs(patternDragStartStep - patternDragEndStep) + 1;

                addPattern(patternDragTrackId, newPatternStep, newPatternSize);

                // reset
                setPatternDragTrackId(-1);
                setPatternDragStartStep(-1);
                setPatternDragEndStep(-1);
            } else if (rangeDragStartStep !== -1 && rangeDragEndStep !== -1) {
                const startStep = Math.min(rangeDragStartStep, rangeDragEndStep);
                const endStep = rangeDragStartStep === rangeDragEndStep
                    ? startStep + DEFAULT_PLAY_RANGE_SIZE
                    : Math.max(rangeDragStartStep, rangeDragEndStep) + 1;

                setPlayRangeStart(startStep);
                setPlayRangeEnd(endStep);
                setCurrentPlayerPosition(-1);

                // reset
                setRangeDragStartStep(-1);
                setRangeDragEndStep(-1);
            }
        } else if (e.button === 2) { // Right mouse button
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;
            if (y < SEQUENCER_GRID_METER_HEIGHT) {
                if (e.button === 2) {
                    if (playRangeStart !== -1 && playRangeEnd !== -1) {
                        setPlayRangeStart(-1);
                        setPlayRangeEnd(-1);
                    } else {
                        const x = e.clientX - rect.left + sequencerScrollWindow.x;
                        const step = Math.floor(x / sequencerPatternWidth * SEQUENCER_RESOLUTION * SEQUENCER_RESOLUTION);
                        setCurrentPlayerPosition(step);
                        setForcePlayerRomRebuild(prev => prev + 1);
                    }
                }
            }
        }
    };

    const onMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
        if (patternDragTrackId !== -1 && patternDragStartStep !== -1 && patternDragEndStep !== -1) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left + sequencerScrollWindow.x;
            const y = e.clientY - rect.top - SEQUENCER_GRID_METER_HEIGHT;

            const step = Math.floor(x / sequencerPatternWidth * SEQUENCER_RESOLUTION);
            const trackId = Math.floor(y / sequencerPatternHeight);

            if (trackId !== patternDragTrackId) {
                setPatternDragTrackId(trackId);
            }

            if (step !== patternDragEndStep) {
                setPatternDragEndStep(step);
            }
        } else if (rangeDragStartStep !== -1 && rangeDragEndStep !== -1) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left + sequencerScrollWindow.x;

            const step = Math.floor(x / sequencerPatternWidth * SEQUENCER_RESOLUTION * SEQUENCER_RESOLUTION);

            if (step !== rangeDragEndStep) {
                setRangeDragEndStep(step);
            }
        }
    };

    useEffect(() => {
        draw();
    }, [
        soundData,
        currentThemeType,
        currentTrackId,
        currentSequenceIndex,
        playRangeStart,
        playRangeEnd,
        sequencerPatternHeight,
        sequencerPatternWidth,
        sequencerScrollWindow.x,
        sequencerScrollWindow.w,
    ]);

    return (
        <StyledCanvas
            height={height}
            width={width}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
            ref={canvasRef}
        />
    );
}
