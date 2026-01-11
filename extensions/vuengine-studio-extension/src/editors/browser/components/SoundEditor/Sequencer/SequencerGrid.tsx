import React, { Dispatch, MouseEvent, SetStateAction, useContext, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { scaleCanvasAccountForDpi } from '../../Common/Utils';
import {
    DEFAULT_PLAY_RANGE_SIZE,
    NOTE_RESOLUTION,
    SCROLL_BAR_WIDTH,
    ScrollWindow,
    SEQUENCER_GRID_METER_HEIGHT,
    SEQUENCER_RESOLUTION,
    SoundData,
} from '../SoundEditorTypes';

const StyledCanvas = styled.canvas`
    cursor: crosshair;
    left: 0;
    position: sticky;
    z-index: 1;
`;

interface SequencerGridProps {
    soundData: SoundData
    currentTrackId: number
    addPattern: (trackId: number, bar: number, size?: number) => Promise<boolean>
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

        const c = currentThemeType === 'light' ? 0 : 255;

        context.strokeStyle = `rgba(${c}, ${c}, ${c}, .1)`;
        context.lineWidth = 1;
        context.font = '9px monospace';
        const w = canvas.width;
        const h = canvas.height;

        // highlight current track
        context.rect(
            0,
            SEQUENCER_GRID_METER_HEIGHT + currentTrackId * sequencerPatternHeight,
            w,
            sequencerPatternHeight - 1
        );
        context.fillStyle = `rgba(${c}, ${c}, ${c}, .1)`;
        context.fill();
        context.fillStyle = `rgba(${c}, ${c}, ${c}, .4)`;

        // vertical lines
        for (let x = 0; x <= soundData.size; x++) {
            const offset = x * sequencerPatternWidth / SEQUENCER_RESOLUTION - sequencerScrollWindow.x - 0.5;
            context.beginPath();
            context.moveTo(offset, x % (4 * SEQUENCER_RESOLUTION) ? SEQUENCER_GRID_METER_HEIGHT : 0);
            context.lineTo(offset, h);
            context.strokeStyle = x === soundData.size
                ? `rgba(${c}, ${c}, ${c}, .6)`
                : x % (4 * SEQUENCER_RESOLUTION) === 0
                    ? `rgba(${c}, ${c}, ${c}, .4)`
                    : x % SEQUENCER_RESOLUTION === 0
                        ? `rgba(${c}, ${c}, ${c}, .2)`
                        : `rgba(${c}, ${c}, ${c}, .1)`;
            context.stroke();

            // meter numbers
            if ((x / SEQUENCER_RESOLUTION) % 4 === 0) {
                context.fillText((x / SEQUENCER_RESOLUTION).toString(), offset + 3, 10);
            }
        }

        // horizontal lines
        for (let y = 0; y <= soundData.tracks.length; y++) {
            const offset = SEQUENCER_GRID_METER_HEIGHT + y * sequencerPatternHeight - 0.5;
            context.beginPath();
            context.moveTo(0, offset);
            context.lineTo(w, offset);
            context.strokeStyle = y % soundData.tracks.length === 0
                ? `rgba(${c}, ${c}, ${c}, .6)`
                : `rgba(${c}, ${c}, ${c}, .4)`;
            context.stroke();
        }

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
        currentThemeType,
        soundData.size,
        soundData.tracks.length,
        currentTrackId,
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
