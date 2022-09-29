import React from 'react';
import VContainer from '../../../../core/browser/components/VContainer';
import { ChannelConfig, MusicEditorStateApi, PatternConfig, PATTERN_SIZES } from '../../ves-music-editor-types';

interface CurrentPatternProps {
    pattern: PatternConfig
    channel: ChannelConfig
    currentPattern: number
    stateApi: MusicEditorStateApi
}

export default function CurrentPattern(props: CurrentPatternProps): JSX.Element {
    const { channel, currentPattern, pattern, stateApi } = props;

    return <div className='section currentPattern'>
        <VContainer>
            <label>Pattern</label>
            <select
                className='theia-select'
                value={currentPattern}
                onChange={e => stateApi.setCurrentPattern(channel.id, parseInt(e.target.value))}
            >
                {channel.patterns.map((n, i) => (
                    <option key={`select-pattern-${i}`} value={i}>{i + 1}</option>
                ))}
            </select>
        </VContainer>

        <VContainer>
            Size
            <select
                className='theia-select'
                value={pattern.size}
                onChange={e => stateApi.setPatternSize(parseInt(e.target.value))}
            >
                {PATTERN_SIZES.map(size =>
                    <option value={size}>{size}</option>
                )}
            </select>
        </VContainer>

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
                <div style={{ minWidth: 24, textAlign: 'right', width: 24 }}>
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
                <div style={{ minWidth: 24, textAlign: 'right', width: 24 }}>
                    100
                </div>
            </HContainer>
        </VContainer>
        */}
    </div>;
}
