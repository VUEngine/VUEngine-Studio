import React, { SyntheticEvent, useContext, useEffect, useRef } from 'react';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { VSU_NUMBER_OF_CHANNELS } from '../Emulator/VsuTypes';
import { ChannelConfig, MAX_SEQUENCE_SIZE, MIN_SEQUENCE_SIZE, NOTE_RESOLUTION, PATTERN_HEIGHT, SEQUENCER_GRID_METER_HEIGHT, SoundData } from '../SoundEditorTypes';
import Pattern from './Pattern';

const StyledGridContainer = styled.div`
    height: ${VSU_NUMBER_OF_CHANNELS * PATTERN_HEIGHT + SEQUENCER_GRID_METER_HEIGHT}px;
    position: relative;
    user-select: none;

    > .react-resizable {
        height: 100% !important;
        margin-left: 51px;
        margin-right: 80px;
        overflow: hidden;

        canvas {
            cursor: crosshair;
        }
    }

    > .react-resizable .react-resizable-handle {
        align-items: center;
        border: 1px solid rgba(255, 255, 255, .2);
        bottom: -1px;
        cursor: col-resize;
        display: flex;
        justify-content: center;
        position: absolute;
        right: 58px;
        top: ${SEQUENCER_GRID_METER_HEIGHT - 1}px;
        width: 16px;

        body.theia-light &,
        body.theia-hc & {
            border: 1px solid rgba(0, 0, 0, .2);
        }

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
    currentChannelId: number
    currentPatternId: number
    currentSequenceIndex: number
    setCurrentSequenceIndex: (channel: number, sequenceIndex: number) => void
    setChannel: (channelId: number, channel: Partial<ChannelConfig>) => void
}

export default function SequencerGrid(props: SequencerGridProps): React.JSX.Element {
    const {
        soundData, updateSoundData,
        currentChannelId, currentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        setChannel,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    // eslint-disable-next-line no-null/no-null
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const height = VSU_NUMBER_OF_CHANNELS * PATTERN_HEIGHT + SEQUENCER_GRID_METER_HEIGHT;
    const width = soundData.size * NOTE_RESOLUTION;

    const setSize = (size: number): void => {
        if (size <= MAX_SEQUENCE_SIZE && size >= MIN_SEQUENCE_SIZE) {
            updateSoundData({ ...soundData, size });
        }
    };

    const accountForDPI = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }

        const dpr = window.devicePixelRatio ?? 1;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        context.scale(dpr, dpr);

        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
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

        const c = services.themeService.getCurrentTheme().type === 'light' ? 0 : 255;

        context.strokeStyle = `rgba(${c}, ${c}, ${c}, .1)`;
        context.lineWidth = 1;
        context.font = '9px monospace';
        const w = canvas.width;
        const h = canvas.height;

        // highlight current channel
        context.rect(
            0,
            SEQUENCER_GRID_METER_HEIGHT + currentChannelId * PATTERN_HEIGHT,
            width,
            PATTERN_HEIGHT
        );
        context.fillStyle = `rgba(${c}, ${c}, ${c}, .1)`;
        context.fill();
        context.fillStyle = `rgba(${c}, ${c}, ${c}, .4)`;

        // vertical lines
        for (let x = 1; x <= soundData.size; x++) {
            const offset = x * NOTE_RESOLUTION - 0.5;
            context.beginPath();
            context.moveTo(offset, x % 4 ? SEQUENCER_GRID_METER_HEIGHT : 0);
            context.lineTo(offset, h);
            context.strokeStyle = x % soundData.size === 0
                ? `rgba(${c}, ${c}, ${c}, .4)`
                : x % 4 === 0
                    ? `rgba(${c}, ${c}, ${c}, .2)`
                    : `rgba(${c}, ${c}, ${c}, .1)`;
            context.stroke();

            // meter numbers
            if (x % 4 === 1) {
                context.fillText(((x - 1) / 4 + 1).toString(), offset - NOTE_RESOLUTION + 5, 12);
            }
        }

        // horizontal lines
        for (let y = 0; y <= VSU_NUMBER_OF_CHANNELS; y++) {
            const offset = SEQUENCER_GRID_METER_HEIGHT + y * PATTERN_HEIGHT - 0.5;
            context.beginPath();
            context.moveTo(0, offset);
            context.lineTo(w, offset);
            context.strokeStyle = y % VSU_NUMBER_OF_CHANNELS === 0
                ? `rgba(${c}, ${c}, ${c}, .4)`
                : `rgba(${c}, ${c}, ${c}, .2)`;
            context.stroke();
        }
    };

    const onResize = (event: SyntheticEvent, data: ResizeCallbackData) => {
        const newSize = Math.floor(data.size.width / NOTE_RESOLUTION);
        setSize(newSize);
    };

    const onClick = (e: React.MouseEvent<HTMLElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top - SEQUENCER_GRID_METER_HEIGHT;
        if (y < 0) {
            return;
        }

        const channelId = Math.floor(y / PATTERN_HEIGHT);
        const step = Math.ceil(x / NOTE_RESOLUTION);

        console.log('channelId', channelId);
        console.log('step', step);
        console.log('e.buttons', e.buttons);
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
        accountForDPI();
        draw();
    }, [
        currentChannelId,
        soundData.size,
    ]);

    return (
        <StyledGridContainer className={classNames.join(' ')}>
            {soundData.channels.map(channel =>
                channel.sequence.map((patternId, index) =>
                    <Pattern
                        key={`${channel.id}-${index}`}
                        soundData={soundData}
                        index={index}
                        channelId={channel.id}
                        pattern={channel.patterns[patternId]}
                        patternSize={channel.patterns[patternId].size * NOTE_RESOLUTION}
                        patternId={patternId}
                        currentChannelId={currentChannelId}
                        currentPatternId={currentPatternId}
                        currentSequenceIndex={currentSequenceIndex}
                        setCurrentSequenceIndex={setCurrentSequenceIndex}
                        setChannel={setChannel}
                    />
                )
            )}
            <ResizableBox
                width={width}
                height={height}
                draggableOpts={{
                    grid: [NOTE_RESOLUTION, PATTERN_HEIGHT]
                }}
                axis="x"
                minConstraints={[NOTE_RESOLUTION * MIN_SEQUENCE_SIZE, PATTERN_HEIGHT]}
                maxConstraints={[NOTE_RESOLUTION * MAX_SEQUENCE_SIZE, PATTERN_HEIGHT]}
                resizeHandles={['e']}
                onResize={onResize}
            >
                <canvas
                    height={height}
                    width={width}
                    onClick={onClick}
                    onContextMenu={onClick}
                    ref={canvasRef}
                />
            </ResizableBox>
        </StyledGridContainer>
    );
}
