import React, { SyntheticEvent, useContext, useEffect, useRef } from 'react';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import styled from 'styled-components';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME, EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import {
    ChannelConfig,
    MAX_SEQUENCE_SIZE,
    MIN_SEQUENCE_SIZE,
    NOTE_RESOLUTION,
    PATTERN_HEIGHT,
    PIANO_ROLL_KEY_WIDTH,
    SequenceMap,
    SEQUENCER_GRID_METER_HEIGHT,
    SoundData,
} from '../SoundEditorTypes';
import { nanoid, scaleCanvasAccountForDpi } from '../../Common/Utils';
import { SoundEditorCommands } from '../SoundEditorCommands';
import { nls, QuickPickItem } from '@theia/core';
import { StyledSequencer } from './Sequencer';

const NEW_PATTERN_ID = '+';

const StyledGridContainer = styled.div`
    position: relative;
    user-select: none;

    > .react-resizable {
        height: 100% !important;
        margin-left: ${PIANO_ROLL_KEY_WIDTH + 1}px;
        margin-right: 80px;
        overflow: hidden;

        canvas {
            cursor: crosshair;
        }
    }

    ${StyledSequencer}.hidden & {
        > .react-resizable {
            margin-left: -1px;
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
        right: 60px;
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
    currentChannelId: number
    currentPatternId: string
    setCurrentPatternId: (channelId: number, patternId: string) => void
    currentSequenceIndex: number
    setCurrentSequenceIndex: (channel: number, sequenceIndex: number) => void
    setChannel: (channelId: number, channel: Partial<ChannelConfig>) => void
}

export default function SequencerGrid(props: SequencerGridProps): React.JSX.Element {
    const {
        soundData, updateSoundData,
        currentChannelId,
        // currentPatternId,
        setCurrentPatternId,
        // currentSequenceIndex, setCurrentSequenceIndex,
        setChannel,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    // eslint-disable-next-line no-null/no-null
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const height = soundData.channels.length * PATTERN_HEIGHT + SEQUENCER_GRID_METER_HEIGHT;
    const width = MAX_SEQUENCE_SIZE * NOTE_RESOLUTION;

    const setSize = (size: number): void => {
        if (size <= MAX_SEQUENCE_SIZE && size >= MIN_SEQUENCE_SIZE) {
            updateSoundData({
                ...soundData,
                channels: [
                    ...soundData.channels.map(c => {
                        const updatedSequence: SequenceMap = {};
                        Object.keys(c.sequence).map(k => {
                            const step = parseInt(k);
                            const patternId = c.sequence[step];
                            const pattern = soundData.patterns[patternId];
                            if (step + pattern.size <= size) {
                                updatedSequence[step] = patternId;
                            }
                        });
                        return {
                            ...c,
                            sequence: updatedSequence
                        };
                    })
                ],
                size,
            });
        }
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
        context.textAlign = 'right';
        const w = canvas.width;
        const h = canvas.height;

        // highlight current channel
        context.rect(
            0,
            SEQUENCER_GRID_METER_HEIGHT + currentChannelId * PATTERN_HEIGHT,
            MAX_SEQUENCE_SIZE * NOTE_RESOLUTION,
            PATTERN_HEIGHT - 1
        );
        context.fillStyle = `rgba(${c}, ${c}, ${c}, .1)`;
        context.fill();
        context.fillStyle = `rgba(${c}, ${c}, ${c}, .4)`;

        // vertical lines
        for (let x = 1; x <= MAX_SEQUENCE_SIZE; x++) {
            const offset = x * NOTE_RESOLUTION - 0.5;
            context.beginPath();
            context.moveTo(offset, x % 4 ? SEQUENCER_GRID_METER_HEIGHT : 0);
            context.lineTo(offset, h);
            context.strokeStyle = x % MAX_SEQUENCE_SIZE === 0
                ? `rgba(${c}, ${c}, ${c}, .4)`
                : x % 4 === 0
                    ? `rgba(${c}, ${c}, ${c}, .2)`
                    : `rgba(${c}, ${c}, ${c}, .1)`;
            context.stroke();

            // meter numbers
            if (x % 4 === 0) {
                context.fillText(x.toString(), offset - 4, 12);
            }
        }

        // horizontal lines
        for (let y = 0; y <= soundData.channels.length; y++) {
            const offset = SEQUENCER_GRID_METER_HEIGHT + y * PATTERN_HEIGHT - 0.5;
            context.beginPath();
            context.moveTo(0, offset);
            context.lineTo(w, offset);
            context.strokeStyle = y % soundData.channels.length === 0
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
        const step = Math.floor(x / NOTE_RESOLUTION);

        if (e.buttons === 0) {
            addPattern(channelId, step);
        } else if (e.buttons === 2) {
            // TODO
        }
    };

    const classNames = [];
    if (soundData.size === MIN_SEQUENCE_SIZE) {
        classNames.push('min');
    } else if (soundData.size === MAX_SEQUENCE_SIZE) {
        classNames.push('max');
    }

    const addPatternToSequence = async (channelId: number, step: number, patternId: string): Promise<void> => {
        const channel = soundData.channels[channelId];
        // create if it's a new pattern
        if (patternId === NEW_PATTERN_ID) {
            const newPatternId = nanoid();
            const type = services.vesProjectService.getProjectDataType('Sound');
            const schema = await window.electronVesCore.dereferenceJsonSchema(type!.schema);
            // @ts-ignore
            const newPattern = services.vesProjectService.generateDataFromJsonSchema(schema?.properties?.patterns?.additionalProperties);

            const updatedChannels = [...soundData.channels];
            updatedChannels[channelId].sequence = {
                ...channel.sequence,
                [step.toString()]: newPatternId,
            };

            updateSoundData({
                ...soundData,
                channels: updatedChannels,
                patterns: {
                    ...soundData.patterns,
                    [newPatternId]: {
                        ...newPattern,
                        size: 4,
                    }
                }
            });
            setCurrentPatternId(channelId, newPatternId);
        } else {
            setChannel(channelId, {
                ...channel,
                sequence: {
                    ...channel.sequence,
                    [step.toString()]: patternId,
                },
            });
            setCurrentPatternId(channelId, patternId);
        }
    };

    const showPatternSelection = async (channelId: number): Promise<QuickPickItem | undefined> =>
        services.quickPickService.show(
            [
                {
                    id: NEW_PATTERN_ID,
                    label: nls.localize('vuengine/editors/sound/newPattern', 'New Pattern'),
                },
                ...Object.keys(soundData.patterns).map((p, i) => ({
                    id: p,
                    label: soundData.patterns[p].name.length
                        ? soundData.patterns[p].name
                        : (i + 1).toString(),
                })),
            ],
            {
                title: nls.localize('vuengine/editors/sound/addPattern', 'Add Pattern'),
                placeholder: nls.localize('vuengine/editors/sound/selectPatternToAdd', 'Select a pattern to add...'),
            }
        );

    const addPattern = async (channelId: number, step: number): Promise<void> => {
        const patternToAdd = await showPatternSelection(channelId);
        if (patternToAdd && patternToAdd.id) {
            addPatternToSequence(channelId, step, patternToAdd.id);
        }
    };

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
            case SoundEditorCommands.ADD_PATTERN.id:
                // addPattern();
                break;
        }
    };

    useEffect(() => {
        document.addEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        return () => {
            document.removeEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        };
    }, []);

    useEffect(() => {
        services.themeService.onDidColorThemeChange(() => draw());
    }, []);

    useEffect(() => {
        draw();
    }, [
        soundData.channels.length,
        currentChannelId,
    ]);

    return (
        <StyledGridContainer
            className={classNames.join(' ')}
            style={{
                height: soundData.channels.length * PATTERN_HEIGHT + SEQUENCER_GRID_METER_HEIGHT,
            }}>
            <ResizableBox
                width={soundData.size * NOTE_RESOLUTION}
                height={height}
                draggableOpts={{
                    grid: [NOTE_RESOLUTION, PATTERN_HEIGHT]
                }}
                axis="x"
                minConstraints={[NOTE_RESOLUTION * MIN_SEQUENCE_SIZE, PATTERN_HEIGHT]}
                maxConstraints={[NOTE_RESOLUTION * MAX_SEQUENCE_SIZE, PATTERN_HEIGHT]}
                resizeHandles={['e']}
                onResizeStop={onResize}
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
