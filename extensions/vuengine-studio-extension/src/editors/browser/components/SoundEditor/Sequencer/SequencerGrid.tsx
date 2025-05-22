import React, { Dispatch, SetStateAction, SyntheticEvent, useContext, useEffect, useRef } from 'react';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { scaleCanvasAccountForDpi } from '../../Common/Utils';
import {
    DEFAULT_PATTERN_SIZE,
    MAX_SEQUENCE_SIZE,
    MIN_SEQUENCE_SIZE,
    SequenceMap,
    SEQUENCER_GRID_METER_HEIGHT,
    SEQUENCER_RESOLUTION,
    SoundData,
    TrackConfig
} from '../SoundEditorTypes';

const StyledGridContainer = styled.div`
    margin-right: 80px;
    position: relative;
    width: fit-content;
    z-index: 1;

    > .react-resizable {
        height: 100% !important;
        overflow: hidden;

        canvas {
            cursor: crosshair;
        }
    }

    > .react-resizable .react-resizable-handle {
        align-items: center;
        border: 1px solid var(--theia-dropdown-border);
        bottom: 0;
        cursor: col-resize;
        display: flex;
        justify-content: center;
        position: absolute;
        right: -22px;
        top: ${SEQUENCER_GRID_METER_HEIGHT - 1}px;
        width: 16px;

        &:before {
            color: rgba(255, 255, 255, .2);
            content: '\\ea99';
            font: normal normal normal 11px / 1 codicon;
            text-rendering: auto;

            body.theia-light &,
            body.theia-hc & {
                color: rgba(0, 0, 0, .2);
            }
        }

        &:focus,
        &:hover {
            background-color: var(--theia-focusBorder);
            border-color: var(--theia-focusBorder);

            &:before {
                color: #fff !important;
            }
        }
    }

    &.min {
        .react-resizable-handle {
            cursor: e-resize;

            &:before {
                content: '\\ea9c';
            }
        }
    }

    &.max {
        .react-resizable-handle {
            cursor: w-resize;

            &:before {
                content: '\\ea9b';
            }
        }
    }
`;

interface SequencerGridProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
    currentTrackId: number
    currentPatternId: string
    setCurrentPatternId: (trackId: number, patternId: string) => void
    currentSequenceIndex: number
    setCurrentSequenceIndex: (trackId: number, sequenceIndex: number) => void
    setTrack: (trackId: number, track: Partial<TrackConfig>) => void
    addPattern: (trackId: number, bar: number, size?: number, createNew?: boolean) => void
    sequencerPatternHeight: number
    sequencerPatternWidth: number
    dragStartTrackId: number
    dragStartStep: number
    dragEndStep: number
    setDragStartTrackId: Dispatch<SetStateAction<number>>
    setDragStartStep: Dispatch<SetStateAction<number>>
    setDragEndStep: Dispatch<SetStateAction<number>>
}

export default function SequencerGrid(props: SequencerGridProps): React.JSX.Element {
    const {
        soundData, updateSoundData,
        currentTrackId,
        // currentPatternId,
        // setCurrentPatternId,
        // currentSequenceIndex, setCurrentSequenceIndex,
        // setTrack,
        addPattern,
        sequencerPatternHeight, sequencerPatternWidth,
        dragStartTrackId, setDragStartTrackId,
        dragStartStep, setDragStartStep,
        dragEndStep, setDragEndStep,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    // eslint-disable-next-line no-null/no-null
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const songLength = soundData.size / SEQUENCER_RESOLUTION;
    const height = soundData.tracks.length * sequencerPatternHeight + SEQUENCER_GRID_METER_HEIGHT;
    const width = songLength * sequencerPatternWidth;

    const setSize = (size: number): void => {
        if (size > MAX_SEQUENCE_SIZE || size < MIN_SEQUENCE_SIZE) {
            return;
        }

        updateSoundData({
            ...soundData,
            tracks: [
                ...soundData.tracks.map(t => {
                    const updatedSequence: SequenceMap = {};
                    Object.keys(t.sequence).map(k => {
                        const step = parseInt(k);
                        const patternId = t.sequence[step];
                        const pattern = soundData.patterns[patternId];
                        if (!pattern) {
                            return;
                        }
                        const patternSize = pattern.size / SEQUENCER_RESOLUTION;
                        if (step + patternSize <= size) {
                            updatedSequence[step] = patternId;
                        }
                    });
                    return {
                        ...t,
                        sequence: updatedSequence
                    };
                })
            ],
            size,
        });
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
            songLength * sequencerPatternWidth,
            sequencerPatternHeight - 1
        );
        context.fillStyle = `rgba(${c}, ${c}, ${c}, .1)`;
        context.fill();
        context.fillStyle = `rgba(${c}, ${c}, ${c}, .4)`;

        // vertical lines
        for (let x = 0; x <= soundData.size; x++) {
            const offset = x * sequencerPatternWidth / SEQUENCER_RESOLUTION - 0.5;
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

    const onResize = (event: SyntheticEvent, data: ResizeCallbackData) => {
        const newSize = Math.ceil(data.size.width / sequencerPatternWidth * SEQUENCER_RESOLUTION);
        setSize(newSize);
    };

    const onMouseDown = (e: React.MouseEvent<HTMLElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
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
        const x = e.clientX - rect.left;
        const step = Math.floor(x / sequencerPatternWidth * SEQUENCER_RESOLUTION);

        if (step !== dragEndStep) {
            setDragEndStep(step);
        }
    };

    const classNames = [];
    if (soundData.size === MIN_SEQUENCE_SIZE) {
        classNames.push('min');
    } else if (soundData.size === MAX_SEQUENCE_SIZE) {
        classNames.push('max');
    }

    useEffect(() => {
        services.themeService.onDidColorThemeChange(() => draw());
    }, []);

    useEffect(() => {
        draw();
    }, [
        soundData.size,
        soundData.tracks.length,
        currentTrackId,
        sequencerPatternHeight,
        sequencerPatternWidth,
    ]);

    return (
        <StyledGridContainer
            className={classNames.join(' ')}
            style={{
                height: soundData.tracks.length * sequencerPatternHeight + SEQUENCER_GRID_METER_HEIGHT,
            }}>
            <ResizableBox
                width={songLength * sequencerPatternWidth}
                height={height}
                draggableOpts={{
                    grid: [sequencerPatternWidth / SEQUENCER_RESOLUTION, sequencerPatternHeight]
                }}
                axis="x"
                minConstraints={[sequencerPatternWidth * MIN_SEQUENCE_SIZE, sequencerPatternHeight]}
                maxConstraints={[sequencerPatternWidth * MAX_SEQUENCE_SIZE, sequencerPatternHeight]}
                resizeHandles={['e']}
                onResizeStop={onResize}
            >
                <canvas
                    height={height}
                    width={width}
                    onMouseDown={onMouseDown}
                    onMouseUp={onMouseUp}
                    onMouseMove={onMouseMove}
                    onMouseOut={() => {
                        setDragStartTrackId(-1);
                        setDragStartStep(-1);
                        setDragEndStep(-1);
                    }}
                    ref={canvasRef}
                />
            </ResizableBox>
        </StyledGridContainer>
    );
}
