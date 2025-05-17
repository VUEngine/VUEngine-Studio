import React, { Dispatch, SetStateAction, SyntheticEvent, useEffect, useMemo } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import styled from 'styled-components';
import { ColorMode } from '../../../../../core/browser/ves-common-types';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME } from '../../../ves-editors-types';
import CanvasImage from '../../Common/CanvasImage';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';
import { DisplayMode } from '../../Common/VUEngineTypes';
import { SoundEditorCommands } from '../SoundEditorCommands';
import {
    ChannelConfig,
    NOTE_RESOLUTION,
    NOTES_SPECTRUM,
    PatternConfig,
    PIANO_ROLL_KEY_WIDTH,
    SEQUENCER_GRID_METER_HEIGHT,
    SEQUENCER_GRID_WIDTH,
    SoundData,
    SoundEvent,
    SUB_NOTE_RESOLUTION,
} from '../SoundEditorTypes';

const StyledPattern = styled.div`
    background-color: var(--theia-secondaryButton-background);
    box-sizing: border-box;
    cursor: move;
    overflow: hidden;
    position: absolute;
    z-index: 10;

    &:hover,
    &.current {
        outline: 1px solid var(--theia-focusBorder);
        z-index: 11;
    }
        
    &.selected {
        border-radius: 1px;
        outline: 3px solid var(--theia-focusBorder);
        z-index: 11;
    }

    &.dragging {
        border: 1px solid var(--theia-focusBorder);
        cursor: grabbing;
        outline: 0;
    }

    canvas {
        box-sizing: border-box;
    }

    .react-resizable-handle {
        border-left: 1px solid rgba(255, 255, 255, .5);
        bottom: 3px;
        cursor: col-resize;
        position: absolute;
        right: 0;
        top: 3px;
        width: 2px;
        z-index: 10;
    }
`;

const StyledPatternName = styled.div`
    display: flex;
    font-size: 9px;
    height: 100%;
    overflow: hidden;
    padding: 0 3px;
    position: relative;
    text-overflow: ellipsis;
    white-space: nowrap;
    z-index: 1;
`;

interface PatternProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
    patternIndex: number
    step: number
    pattern: PatternConfig
    channelId: number
    patternId: string
    currentChannelId: number
    currentPatternId: string
    currentSequenceIndex: number
    setCurrentSequenceIndex: (channel: number, sequenceIndex: number) => void
    setChannel: (channelId: number, channel: Partial<ChannelConfig>) => void
    setPatternDialogOpen: Dispatch<SetStateAction<boolean>>
    sequencerPatternHeight: number
    sequencerPatternWidth: number
}

export default function PlacedPattern(props: PatternProps): React.JSX.Element {
    const {
        soundData, updateSoundData,
        patternIndex,
        step,
        channelId,
        pattern, patternId,
        currentChannelId, currentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        setChannel,
        setPatternDialogOpen,
        sequencerPatternHeight, sequencerPatternWidth,
    } = props;
    const isCurrent = currentChannelId === channelId && currentPatternId === patternId;
    const channel = soundData.channels[channelId];
    const instrument = soundData.instruments[channel.instrument];
    const noteColor = COLOR_PALETTE[instrument?.color ?? DEFAULT_COLOR_INDEX];
    // TODO: color _each note_ by instrument instead of whole channel

    const classNames = ['placedPattern'];
    if (currentChannelId === channelId && currentSequenceIndex === step) {
        classNames.push('current selected');
    } else if (isCurrent) {
        classNames.push('current');
    }

    const patternNoteWidth = sequencerPatternWidth / NOTE_RESOLUTION;
    const patternName = pattern.name.length ? pattern.name : (patternIndex + 1).toString();
    const width = pattern.size * sequencerPatternWidth - SEQUENCER_GRID_WIDTH;

    const patternPixels: number[][][] = useMemo(() => {
        const result: number[][] = [[]];

        const placePixel = (x: number, y: number) => {
            for (let k = 0; k < patternNoteWidth; k++) {
                const xPos = Math.round(x * patternNoteWidth + k);
                result[y][xPos] = 1;
                if (result[y - 1]) {
                    result[y - 1][xPos] = 1;
                }
                if (result[y + 1]) {
                    result[y + 1][xPos] = 1;
                }
            }
        };

        // init array
        const emptyLine = [...Array(width)].map(v => 0);
        [...Array(sequencerPatternHeight)].map(v => result.push([...emptyLine]));

        // find set notes
        Object.keys(pattern.events).forEach((key: string) => {
            const s = parseInt(key);
            const event = pattern.events[s];
            const note = event[SoundEvent.Note];
            if (note !== undefined) {
                const duration = event[SoundEvent.Duration]
                    ? Math.floor(event[SoundEvent.Duration] / SUB_NOTE_RESOLUTION)
                    : 1;
                const startXPosition = Math.floor(s / SUB_NOTE_RESOLUTION);
                const noteYPosition = Math.round(sequencerPatternHeight / NOTES_SPECTRUM * note);
                for (let k = 0; k < duration; k++) {
                    placePixel(startXPosition + k, noteYPosition);
                }
            }
        });

        return [result];
    }, [
        pattern.events,
        sequencerPatternHeight,
        sequencerPatternWidth,
    ]);

    const removeFromSequence = (cId: number, i: number): void => {
        const updatedSequence = { ...soundData.channels[cId].sequence };
        delete (updatedSequence[i]);
        setChannel(cId, {
            sequence: updatedSequence,
        });
    };

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
            case SoundEditorCommands.REMOVE_CURRENT_PATTERN.id:
                removeFromSequence(currentChannelId, step);
                break;
        }
    };

    const onResize = (event: SyntheticEvent, data: ResizeCallbackData) => {
        const newSize = Math.floor(data.size.width / sequencerPatternWidth);
        updateSoundData({
            ...soundData,
            patterns: {
                ...soundData.patterns,
                [patternId]: {
                    ...soundData.patterns[patternId],
                    size: newSize
                },
            },
        });
    };

    const onDragStop = (e: DraggableEvent, data: DraggableData) => {
        const newChannelId = Math.ceil((data.y - SEQUENCER_GRID_METER_HEIGHT) / sequencerPatternHeight);
        const newBar = Math.floor((data.x - PIANO_ROLL_KEY_WIDTH) / sequencerPatternWidth);
        if (newChannelId === channelId && newBar === step) {
            return;
        }

        const updatedChannels = [
            ...soundData.channels.slice(0, newChannelId),
            {
                ...soundData.channels[newChannelId],
                sequence: {
                    ...soundData.channels[newChannelId].sequence,
                    [newBar]: soundData.channels[channelId].sequence[step],
                },
            },
            ...soundData.channels.slice(newChannelId + 1)
        ];
        delete (updatedChannels[channelId].sequence[step]);

        updateSoundData({
            ...soundData,
            channels: updatedChannels,
        });
        setCurrentSequenceIndex(newChannelId, newBar);
    };

    const onClick = (e: React.MouseEvent<HTMLElement>) => {
        if (e.buttons === 0) {
            setCurrentSequenceIndex(channelId, step);
        } else if (e.buttons === 2) {
            removeFromSequence(channelId, step);
        }
    };

    const onDblClick = (e: React.MouseEvent<HTMLElement>) => {
        setPatternDialogOpen(true);
    };

    useEffect(() => {
        document.addEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        return () => {
            document.removeEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        };
    }, [
        currentChannelId,
        currentSequenceIndex,
        soundData,
    ]);

    return (
        <Draggable
            grid={[sequencerPatternWidth, sequencerPatternHeight]}
            handle=".placedPattern"
            cancel=".react-resizable-handle"
            onStop={onDragStop}
            position={{
                x: 2 + PIANO_ROLL_KEY_WIDTH + step * sequencerPatternWidth,
                y: SEQUENCER_GRID_METER_HEIGHT + channelId * sequencerPatternHeight,
            }}
            bounds={{
                bottom: SEQUENCER_GRID_METER_HEIGHT + (soundData.channels.length - 1) * sequencerPatternHeight,
                left: PIANO_ROLL_KEY_WIDTH,
                right: PIANO_ROLL_KEY_WIDTH + soundData.size * sequencerPatternWidth - pattern.size * sequencerPatternWidth,
                top: SEQUENCER_GRID_METER_HEIGHT,
            }}
        >
            <StyledPattern
                className={classNames.join(' ')}
                data-channel={channelId}
                data-position={step}
                onClick={onClick}
                onContextMenu={onClick}
                onDoubleClick={onDblClick}
                title={patternName}
                style={{
                    height: sequencerPatternHeight - SEQUENCER_GRID_WIDTH,
                }}
            >
                <ResizableBox
                    width={width}
                    draggableOpts={{
                        grid: [sequencerPatternWidth, sequencerPatternHeight]
                    }}
                    axis="x"
                    minConstraints={[sequencerPatternWidth, sequencerPatternHeight]}
                    maxConstraints={[sequencerPatternWidth * soundData.size, sequencerPatternHeight]}
                    resizeHandles={channelId === currentChannelId ? ['e'] : []}
                    onResizeStop={onResize}
                >
                    <>
                        <CanvasImage
                            height={sequencerPatternHeight - 1}
                            palette={'00000000'}
                            pixelData={patternPixels}
                            colorOverride={noteColor}
                            width={width}
                            displayMode={DisplayMode.Mono}
                            colorMode={ColorMode.Default}
                            style={{
                                height: sequencerPatternHeight,
                                left: 0,
                                position: 'absolute',
                                top: 0,
                                width: width,
                            }}
                        />
                        <StyledPatternName>
                            {patternName}
                        </StyledPatternName>
                    </>
                </ResizableBox>
            </StyledPattern>
        </Draggable>
    );
}
