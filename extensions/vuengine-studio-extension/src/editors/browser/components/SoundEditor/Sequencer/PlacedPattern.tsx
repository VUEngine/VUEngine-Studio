import React, { SyntheticEvent, useEffect, useMemo } from 'react';
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
} from '../SoundEditorTypes';
import { StyledPattern, StyledPatternName } from './StyledComponents';

interface PatternProps {
    soundData: SoundData
    patternIndex: number
    step: number
    pattern: PatternConfig
    patternSize: number
    channelId: number
    patternId: string
    currentChannelId: number
    currentPatternId: string
    currentSequenceIndex: number
    setCurrentSequenceIndex: (channel: number, sequenceIndex: number) => void
    setChannel: (channelId: number, channel: Partial<ChannelConfig>) => void
}

export default function PlacedPattern(props: PatternProps): React.JSX.Element {
    const {
        soundData,
        patternIndex,
        step,
        channelId,
        pattern, patternSize, patternId,
        currentChannelId, currentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        setChannel,
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

    const patternName = pattern.name.length ? pattern.name : (patternIndex + 1).toString();

    const patternNoteWidth = Math.max(0, 16 / NOTE_RESOLUTION);
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
            const tick = parseInt(key);
            const event = pattern.events[tick];
            const note = event[SoundEvent.Note];
            if (note !== undefined) {
                const duration = event[SoundEvent.Duration] ?? 1;
                const noteYPosition = Math.round(PATTERN_MAPPING_FACTOR * note);
                for (let k = 0; k < duration; k++) {
                    placePixel(tick + k, noteYPosition);
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
                removeFromSequence(currentChannelId, step);
                break;
        }
    };

    const onResize = (event: SyntheticEvent, data: ResizeCallbackData) => {
        const newSize = Math.floor(data.size.width / NOTE_RESOLUTION);
        setChannel(channelId, {
            ...channel,
            patterns: {
                ...channel.patterns,
                [patternId]: {
                    ...channel.patterns[patternId],
                    size: newSize
                },
            },
        });
    };

    const onDragStop = (e: DraggableEvent, data: DraggableData) => {
        const newStep = Math.ceil((data.x - PIANO_ROLL_KEY_WIDTH) / NOTE_RESOLUTION);
        const updatedSequence = { ...soundData.channels[channelId].sequence };
        updatedSequence[newStep] = updatedSequence[step];
        delete (updatedSequence[step]);
        setChannel(channelId, {
            sequence: updatedSequence,
        });
        setCurrentSequenceIndex(channelId, newStep);
    };

    const onClick = (e: React.MouseEvent<HTMLElement>) => {
        console.log('PlacedPattern onClick e.buttons', e.buttons);
        if (e.buttons === 0) {
            console.log('setCurrentSequenceIndex(channelId, step);', channelId, step);
            // setCurrentSequenceIndex(channelId, step);
        } else if (e.buttons === 2) {
            // removeFromSequence(channelId, step);
        }
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
            axis="x"
            position={{
                x: PIANO_ROLL_KEY_WIDTH + step * NOTE_RESOLUTION,
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
                data-position={step}
                onClick={onClick}
                onContextMenu={onClick}
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
