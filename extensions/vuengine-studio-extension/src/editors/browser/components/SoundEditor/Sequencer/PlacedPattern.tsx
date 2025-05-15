import React, { Dispatch, SetStateAction, SyntheticEvent, useEffect, useMemo } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import { ColorMode } from '../../../../../core/browser/ves-common-types';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME } from '../../../ves-editors-types';
import CanvasImage from '../../Common/CanvasImage';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';
import { DisplayMode } from '../../Common/VUEngineTypes';
import { SoundEditorCommands } from '../SoundEditorCommands';
import {
    ChannelConfig,
    NOTE_RESOLUTION,
    PATTERN_HEIGHT,
    PATTERN_MAPPING_FACTOR,
    PatternConfig,
    PIANO_ROLL_KEY_WIDTH,
    SEQUENCER_GRID_METER_HEIGHT,
    SoundData,
    SoundEvent,
    SUB_NOTE_RESOLUTION,
} from '../SoundEditorTypes';
import styled from 'styled-components';

const StyledPattern = styled.div`
    align-items: center;
    background-color: var(--theia-secondaryButton-background);
    border-right: 1px solid rgba(255, 255, 255, .1);
    border-bottom: 1px solid rgba(255, 255, 255, .1);
    box-sizing: border-box;
    cursor: move;
    display: flex;
    height: ${PATTERN_HEIGHT}px;
    justify-content: center;
    margin-right: 1px;
    overflow: hidden;
    position: absolute;
    z-index: 10;

    &:hover,
    &.current {
        outline: 1px solid var(--theia-focusBorder);
        outline-offset: -1px;
        z-index: 11;
    }
        
    &.selected {
        background-color: var(--theia-focusBorder);
        color: #fff;
    }

    &.dragging {
        border: 1px solid var(--theia-focusBorder);
        cursor: grabbing;
        outline: 0;
    }

    canvas {
        box-sizing: border-box;
        height: ${PATTERN_HEIGHT}px;
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
    align-items: center;
    display: flex;
    font-size: 9px;
    height: 100%;
    justify-content: center;
    overflow: hidden;
    padding: 0 3px;
    position: relative;
    text-overflow: ellipsis;
    z-index: 1;
`;

interface PatternProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
    patternIndex: number
    bar: number
    pattern: PatternConfig
    patternSize: number
    channelId: number
    patternId: string
    currentChannelId: number
    currentPatternId: string
    currentSequenceIndex: number
    setCurrentSequenceIndex: (channel: number, sequenceIndex: number) => void
    setChannel: (channelId: number, channel: Partial<ChannelConfig>) => void
    setPatternDialogOpen: Dispatch<SetStateAction<boolean>>
}

export default function PlacedPattern(props: PatternProps): React.JSX.Element {
    const {
        soundData, updateSoundData,
        patternIndex,
        bar,
        channelId,
        pattern, patternSize, patternId,
        currentChannelId, currentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        setChannel,
        setPatternDialogOpen,
    } = props;
    const isCurrent = currentChannelId === channelId && currentPatternId === patternId;
    const channel = soundData.channels[channelId];
    const instrument = soundData.instruments[channel.instrument];
    const noteColor = COLOR_PALETTE[instrument?.color ?? DEFAULT_COLOR_INDEX];
    // TODO: color _each note_ by instrument instead of whole channel

    const classNames = ['placedPattern'];
    if (currentChannelId === channelId && currentSequenceIndex === bar) {
        classNames.push('current selected');
    } else if (isCurrent) {
        classNames.push('current');
    }

    const patternName = pattern.name.length ? pattern.name : (patternIndex + 1).toString();

    const patternNoteWidth = 1;
    const patternPixels: number[][][] = useMemo(() => {
        const result: number[][] = [[]];

        const placePixel = (x: number, y: number) => {
            for (let k = 0; k < patternNoteWidth; k++) {
                result[y][x * patternNoteWidth + k] = 1;
                if (result[y - 1]) {
                    result[y - 1][x * patternNoteWidth + k] = 1;
                }
                if (result[y + 1]) {
                    result[y + 1][x * patternNoteWidth + k] = 1;
                }
            }
        };

        // init array
        const emptyLine = [...Array(patternSize * patternNoteWidth)].map(v => 0);
        [...Array(PATTERN_HEIGHT)].map(v => result.push([...emptyLine]));

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
                const noteYPosition = Math.round(PATTERN_MAPPING_FACTOR * note);
                for (let k = 0; k < duration; k++) {
                    placePixel(startXPosition + k, noteYPosition);
                }
            }
        });

        return [result];
    }, [
        pattern.events,
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
                removeFromSequence(currentChannelId, bar);
                break;
        }
    };

    const onResize = (event: SyntheticEvent, data: ResizeCallbackData) => {
        const newSize = Math.floor(data.size.width / NOTE_RESOLUTION);
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
        const newChannelId = Math.ceil((data.y - SEQUENCER_GRID_METER_HEIGHT) / PATTERN_HEIGHT);
        const newBar = Math.ceil((data.x - PIANO_ROLL_KEY_WIDTH) / NOTE_RESOLUTION);
        if (newChannelId === channelId && newBar === bar) {
            return;
        }

        const updatedChannels = [...soundData.channels];
        updatedChannels[newChannelId].sequence[newBar] = updatedChannels[channelId].sequence[bar];
        delete (updatedChannels[channelId].sequence[bar]);

        updateSoundData({
            ...soundData,
            channels: updatedChannels,
        });
        setCurrentSequenceIndex(newChannelId, newBar);
    };

    const onClick = (e: React.MouseEvent<HTMLElement>) => {
        if (e.buttons === 0) {
            setCurrentSequenceIndex(channelId, bar);
        } else if (e.buttons === 2) {
            removeFromSequence(channelId, bar);
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
            grid={[NOTE_RESOLUTION, PATTERN_HEIGHT]}
            handle=".placedPattern"
            cancel=".react-resizable-handle"
            onStop={onDragStop}
            position={{
                x: PIANO_ROLL_KEY_WIDTH + bar * NOTE_RESOLUTION,
                y: SEQUENCER_GRID_METER_HEIGHT + channelId * PATTERN_HEIGHT,
            }}
            bounds={{
                bottom: SEQUENCER_GRID_METER_HEIGHT + (soundData.channels.length - 1) * PATTERN_HEIGHT,
                left: PIANO_ROLL_KEY_WIDTH,
                right: PIANO_ROLL_KEY_WIDTH + soundData.size * NOTE_RESOLUTION - patternSize,
                top: SEQUENCER_GRID_METER_HEIGHT,
            }}
        >
            <StyledPattern
                className={classNames.join(' ')}
                data-channel={channelId}
                data-position={bar}
                onClick={onClick}
                onContextMenu={onClick}
                onDoubleClick={onDblClick}
                title={patternName}
            >
                <ResizableBox
                    width={patternSize * patternNoteWidth}
                    height={PATTERN_HEIGHT}
                    draggableOpts={{
                        grid: [NOTE_RESOLUTION, PATTERN_HEIGHT]
                    }}
                    axis="x"
                    minConstraints={[NOTE_RESOLUTION, PATTERN_HEIGHT]}
                    maxConstraints={[NOTE_RESOLUTION * soundData.size, PATTERN_HEIGHT]}
                    resizeHandles={channelId === currentChannelId ? ['e'] : []}
                    onResizeStop={onResize}
                >
                    <>
                        <CanvasImage
                            height={PATTERN_HEIGHT + 1}
                            palette={'00000000'}
                            pixelData={patternPixels}
                            colorOverride={noteColor}
                            width={patternSize * patternNoteWidth}
                            displayMode={DisplayMode.Mono}
                            colorMode={ColorMode.Default}
                            style={{
                                left: 0,
                                position: 'absolute',
                                top: 0,
                                width: patternSize * patternNoteWidth,
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
