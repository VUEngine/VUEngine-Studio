import React, { Dispatch, SetStateAction, useContext, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { scaleCanvasAccountForDpi } from '../../Common/Utils';
import {
    DEFAULT_PATTERN_SIZE,
    SCROLL_BAR_WIDTH,
    ScrollWindow,
    SEQUENCER_GRID_METER_HEIGHT,
    SEQUENCER_RESOLUTION,
    SoundData
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
    addPattern: (trackId: number, bar: number, size?: number, createNew?: boolean) => void
    sequencerPatternHeight: number
    sequencerPatternWidth: number
    dragStartTrackId: number
    dragStartStep: number
    dragEndStep: number
    setDragStartTrackId: Dispatch<SetStateAction<number>>
    setDragStartStep: Dispatch<SetStateAction<number>>
    setDragEndStep: Dispatch<SetStateAction<number>>
    sequencerScrollWindow: ScrollWindow
}

export default function SequencerGrid(props: SequencerGridProps): React.JSX.Element {
    const {
        soundData,
        currentTrackId,
        addPattern,
        sequencerPatternHeight, sequencerPatternWidth,
        dragStartTrackId, setDragStartTrackId,
        dragStartStep, setDragStartStep,
        dragEndStep, setDragEndStep,
        sequencerScrollWindow,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;
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

        const c = services.themeService.getCurrentTheme().type === 'light' ? 0 : 255;

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
    };

    const onMouseDown = (e: React.MouseEvent<HTMLElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left + sequencerScrollWindow.x;
        const y = e.clientY - rect.top - SEQUENCER_GRID_METER_HEIGHT;

        const trackId = Math.floor(y / sequencerPatternHeight);
        const step = Math.floor(x / sequencerPatternWidth) * SEQUENCER_RESOLUTION;

        setDragStartTrackId(trackId);
        setDragStartStep(step);
        setDragEndStep(step);
    };

    const onMouseUp = (e: React.MouseEvent<HTMLElement>) => {
        if (dragStartTrackId === -1 || dragStartStep === -1 || dragEndStep === -1) {
            return;
        }

        const newPatternStep = Math.min(dragStartStep, dragEndStep);
        const newPatternSize = dragStartStep === dragEndStep
            ? DEFAULT_PATTERN_SIZE
            : Math.abs(dragStartStep - dragEndStep) + 1;

        addPattern(dragStartTrackId, newPatternStep, newPatternSize, e.button === 0);

        // reset
        setDragStartTrackId(-1);
        setDragStartStep(-1);
        setDragEndStep(-1);
    };

    const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
        if (dragStartTrackId === -1 || dragStartStep === -1 || dragEndStep === -1) {
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left + sequencerScrollWindow.x;

        const step = Math.floor(x / sequencerPatternWidth * SEQUENCER_RESOLUTION);

        if (step !== dragEndStep) {
            setDragEndStep(step);
        }
    };

    useEffect(() => {
        // TODO: wrap in disposable
        // services.themeService.onDidColorThemeChange(() => draw());

        draw();
    }, [
        soundData.size,
        soundData.tracks.length,
        currentTrackId,
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
