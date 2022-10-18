import React, { useContext } from 'react';
import VContainer from '../../../../../core/browser/components/VContainer';
import { MusicEditorContext, MusicEditorContextType, PATTERN_SIZES } from '../MusicEditorTypes';

export default function CurrentPattern(): JSX.Element {
    const { state, songData, setCurrentPattern, setPatternSize } = useContext(MusicEditorContext) as MusicEditorContextType;

    const channel = songData.channels[state.currentChannel];
    const pattern = channel.patterns[state.currentPattern];

    return <VContainer gap={10}>
        <VContainer>
            <label>Pattern</label>
            <select
                className='theia-select'
                value={state.currentPattern}
                onChange={e => setCurrentPattern(channel.id, parseInt(e.target.value))}
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
                onChange={e => setPatternSize(parseInt(e.target.value))}
            >
                {PATTERN_SIZES.map(size =>
                    <option key={`current-pattern-size-option-${size}`} value={size}>{size}</option>
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
    </VContainer>;
}
