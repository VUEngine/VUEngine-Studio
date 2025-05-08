import { nls } from '@theia/core';
import React, { SyntheticEvent, useEffect, useMemo } from 'react';
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
    SEQUENCER_GRID_METER_HEIGHT,
    SoundData,
    SoundEvent,
} from '../SoundEditorTypes';
import { StyledPattern, StyledPatternName, StyledPatternRemove } from './StyledComponents';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { VSU_NUMBER_OF_CHANNELS } from '../Emulator/VsuTypes';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';

interface PatternProps {
    soundData: SoundData
    index: number
    pattern: PatternConfig
    patternSize: number
    channelId: number
    patternId: number
    currentChannelId: number
    currentPatternId: number
    currentSequenceIndex: number
    setCurrentSequenceIndex: (channel: number, sequenceIndex: number) => void
    setChannel: (channelId: number, channel: Partial<ChannelConfig>) => void
}

export default function Pattern(props: PatternProps): React.JSX.Element {
    const {
        soundData,
        index,
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
    if (currentChannelId === channelId && currentSequenceIndex === index) {
        classNames.push('current selected');
    } else if (isCurrent) {
        classNames.push('curren');
    }

    const patternName = pattern.name ? pattern.name : (patternId + 1).toString();

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
        setChannel(cId, {
            sequence: [
                ...soundData.channels[cId].sequence.slice(0, i),
                ...soundData.channels[cId].sequence.slice(i + 1)
            ],
        });
    };

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
            case SoundEditorCommands.REMOVE_CURRENT_PATTERN.id:
                removeFromSequence(currentChannelId, index);
                break;
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

    const onResize = (event: SyntheticEvent, data: ResizeCallbackData) => {
        // const newDuration = Math.floor(data.size.width / PIANO_ROLL_NOTE_WIDTH);
        // setNote(step, note, newDuration);
    };

    const onStop = (e: DraggableEvent, data: DraggableData) => {
        // const newStep = Math.ceil((data.x - PIANO_WIDTH) / PIANO_ROLL_NOTE_WIDTH);
        // const newNoteId = Math.floor(data.y / PIANO_ROLL_NOTE_HEIGHT);
        // setNote(newStep, newNoteId, duration, step);
    };

    return (
        <Draggable
            grid={[NOTE_RESOLUTION, PATTERN_HEIGHT]}
            handle=".placedPattern"
            cancel=".react-resizable-handle"
            onStop={onStop}
            axis="x"
            position={{
                x: 50 + index * NOTE_RESOLUTION,
                y: SEQUENCER_GRID_METER_HEIGHT + channelId * PATTERN_HEIGHT,
            }}
            bounds={{
                bottom: SEQUENCER_GRID_METER_HEIGHT + (VSU_NUMBER_OF_CHANNELS - 1) * PATTERN_HEIGHT,
                left: 50,
                right: 50 + soundData.size * NOTE_RESOLUTION - patternSize,
                top: SEQUENCER_GRID_METER_HEIGHT,
            }}
        >
            <StyledPattern
                className={classNames.join(' ')}
                data-channel={channelId}
                data-position={index}
                onClick={() => setCurrentSequenceIndex(channelId, index)}
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
                    onResize={onResize}
                >
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
                    <StyledPatternRemove
                        title={nls.localizeByDefault('Remove')}
                        onClick={e => {
                            removeFromSequence(channelId, index);
                            e.stopPropagation();
                        }}
                    >
                        &times;
                    </StyledPatternRemove>
                </ResizableBox>
            </StyledPattern>
        </Draggable>
    );
}
