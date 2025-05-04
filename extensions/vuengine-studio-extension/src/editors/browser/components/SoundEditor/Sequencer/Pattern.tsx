import { nls } from '@theia/core';
import React, { useEffect, useMemo } from 'react';
import { SortableItem } from 'react-easy-sort';
import { ColorMode } from '../../../../../core/browser/ves-common-types';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME } from '../../../ves-editors-types';
import CanvasImage from '../../Common/CanvasImage';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';
import { DisplayMode } from '../../Common/VUEngineTypes';
import { SoundEditorCommands } from '../SoundEditorCommands';
import { ChannelConfig, NOTE_RESOLUTION, PATTERN_HEIGHT, PATTERN_MAPPING_FACTOR, PatternConfig, SoundData, SoundEvent } from '../SoundEditorTypes';
import { StyledPattern, StyledPatternName, StyledPatternRemove } from './StyledComponents';

interface PatternProps {
    songData: SoundData
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
        songData,
        index,
        channelId,
        pattern,
        patternSize,
        patternId,
        currentChannelId,
        currentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        setChannel,
    } = props;
    const isCurrent = currentChannelId === channelId && currentPatternId === patternId;
    const channel = songData.channels[channelId];
    const instrument = songData.instruments[channel.instrument];
    const noteColor = COLOR_PALETTE[instrument?.color ?? DEFAULT_COLOR_INDEX];
    // TODO: color _each note_ by instrument instead of whole channel

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
                ...songData.channels[cId].sequence.slice(0, i),
                ...songData.channels[cId].sequence.slice(i + 1)
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
        songData,
    ]);

    return (
        <SortableItem>
            <StyledPattern
                className={currentChannelId === channelId && currentSequenceIndex === index
                    ? 'current selected'
                    : isCurrent
                        ? 'current'
                        : undefined}
                style={{
                    minWidth: `${(patternSize * patternNoteWidth) - 1}px`,
                    width: `${(patternSize * patternNoteWidth) - 1}px`
                }}
                data-channel={channelId}
                data-position={index}
                onClick={() => setCurrentSequenceIndex(channelId, index)}
                title={patternName}
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
            </StyledPattern>
        </SortableItem>
    );
}
