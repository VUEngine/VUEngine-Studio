import { nls } from '@theia/core';
import React from 'react';
import HContainer from '../../Common/HContainer';
import RadioSelect from '../../Common/RadioSelect';
import VContainer from '../../Common/VContainer';
import { PATTERN_SIZES, PatternConfig, SongData } from '../MusicEditorTypes';

interface CurrentPatternProps {
    songData: SongData
    currentChannelId: number
    currentPatternId: number
    setCurrentPatternId: (channelId: number, patternId: number) => void
    setPattern: (channelId: number, patternId: number, pattern: Partial<PatternConfig>) => void
}

export default function CurrentPattern(props: CurrentPatternProps): React.JSX.Element {
    const {
        songData,
        currentChannelId,
        currentPatternId, setCurrentPatternId,
        setPattern,
    } = props;

    const channel = songData.channels[currentChannelId];
    const pattern = channel.patterns[currentPatternId];

    const getName = (i: number): string => channel.patterns[i].name
        ? `${i + 1}: ${channel.patterns[i].name}`
        : (i + 1).toString();

    const setPatternName = (name: string): void => {
        setPattern(currentChannelId, currentPatternId, {
            name: name,
        });
    };

    const setPatternSize = (size: number): void => {
        setPattern(currentChannelId, currentPatternId, {
            size: size,
        });
    };

    return <VContainer gap={10}>
        <VContainer>
            <label>
                {nls.localize('vuengine/musicEditor/pattern', 'Pattern')}
            </label>
            <select
                className='theia-select'
                value={currentPatternId}
                onChange={e => setCurrentPatternId(channel.id, parseInt(e.target.value))}
            >
                {channel.patterns.map((n, i) => (
                    <option key={`select-pattern-${i}`} value={i}>{getName(i)}</option>
                ))}
            </select>
        </VContainer>

        <HContainer gap={15}>
            <VContainer style={{ width: 110 }}>
                <label>
                    {nls.localize('vuengine/musicEditor/name', 'Name')}
                </label>
                <input
                    className='theia-input'
                    value={pattern.name}
                    onChange={e => setPatternName(e.target.value)}
                />
            </VContainer>
            <VContainer>
                Size
                <RadioSelect
                    options={PATTERN_SIZES.map(size => ({ value: size }))}
                    defaultValue={pattern.size}
                    onChange={options => setPatternSize(options[0].value as number)}
                />
            </VContainer>
        </HContainer>

        {/*
        <VContainer>
            Instrument
            <select
                className='theia-select'
            >
                <option value={0}>Channel Default</option>
            </select>
        </VContainer>
        */}

        {/*
        <VContainer>
            <label>Pattern Master Volume</label>
            <HContainer>
                <div style={{ minWidth: 10, width: 10 }}>
                    L
                </div>
                <input
                    type='range'
                    value={100}
                    max={100}
                    min={0}
                    step={100 / VOLUME_STEPS}
                />
                <div style={{ minWidth: 24, overflow: 'hidden', textAlign: 'right', width: 24 }}>
                    100
                </div>
            </HContainer>
            <HContainer>
                <div style={{ minWidth: 10, width: 10 }}>
                    R
                </div>
                <input
                    type='range'
                    value={100}
                    max={100}
                    min={0}
                    step={100 / VOLUME_STEPS}
                />
                <div style={{ minWidth: 24, overflow: 'hidden', textAlign: 'right', width: 24 }}>
                    100
                </div>
            </HContainer>
        </VContainer>
        */}
    </VContainer>;
}
