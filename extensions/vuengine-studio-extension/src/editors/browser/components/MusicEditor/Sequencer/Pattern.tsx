import { nls } from '@theia/core';
import React, { useMemo } from 'react';
import { SortableItem } from 'react-easy-sort';
import { ColorMode } from '../../../../../core/browser/ves-common-types';
import CanvasImage from '../../Common/CanvasImage';
import { DisplayMode } from '../../Common/VUEngineTypes';
import { CHANNEL_BG_COLORS, ChannelConfig, MusicEvent, PATTERN_HEIGHT, PATTERN_MAPPING_FACTOR, PatternConfig, SongData } from '../MusicEditorTypes';
import { StyledPattern, StyledPatternRemove } from './StyledComponents';

interface PatternProps {
    songData: SongData
    index: number
    pattern: PatternConfig
    patternSize: number
    channel: number
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
        channel,
        pattern,
        patternSize,
        patternId,
        currentChannelId,
        currentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        setChannel,
    } = props;
    const isCurrent = currentChannelId === channel && currentPatternId === patternId;
    const noteColor = isCurrent ? '#fff' : CHANNEL_BG_COLORS[channel];

    const patternNoteWidth = Math.max(0, 8 / songData.noteResolution);
    const patternPixels: number[][][] = useMemo(() => {
        const result: number[][] = [[]];

        // init array
        const emptyLine = [...Array(patternSize * patternNoteWidth)].map(v => 0);
        [...Array(PATTERN_HEIGHT)].map(v => result.push([...emptyLine]));

        // find set notes
        Object.keys(pattern.events).forEach((key: string) => {
            const tick = parseInt(key);
            const event = pattern.events[tick];
            const note = event[MusicEvent.Note];
            if (note) {
                const noteYPosition = Math.round(PATTERN_MAPPING_FACTOR * note);
                for (let k = 0; k < patternNoteWidth; k++) {
                    result[noteYPosition][tick * patternNoteWidth + k] = 1;
                }
            }
        });

        return [result];
    }, [
        pattern.events,
        songData.noteResolution,
    ]);

    const removeFromSequence = (channelId: number, i: number): void => {
        setChannel(channelId, {
            sequence: [
                ...songData.channels[channelId].sequence.slice(0, i),
                ...songData.channels[channelId].sequence.slice(i + 1)
            ],
        });
    };

    return (
        <SortableItem>
            <StyledPattern
                className={isCurrent ? 'current' : undefined}
                style={{
                    backgroundColor: currentChannelId === channel && currentSequenceIndex === index
                        ? 'var(--theia-focusBorder)'
                        : undefined,
                    minWidth: `${(patternSize * patternNoteWidth) - 1}px`,
                    width: `${(patternSize * patternNoteWidth) - 1}px`
                }}
                data-channel={channel}
                data-position={index}
                onClick={() => setCurrentSequenceIndex(channel, index)}
                title={`${patternId + 1}${pattern.name ? `: ${pattern.name}` : ''}`}
            >
                <CanvasImage
                    height={PATTERN_HEIGHT}
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
                {patternId + 1}
                <StyledPatternRemove
                    title={nls.localizeByDefault('Remove')}
                    onClick={e => {
                        removeFromSequence(channel, index);
                        e.stopPropagation();
                    }}
                >
                    &times;
                </StyledPatternRemove>
            </StyledPattern>
        </SortableItem>
    );
}
