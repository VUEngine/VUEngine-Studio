import React from 'react';
import VContainer from '../../../../core/browser/components/VContainer';
import { MusicEditorStateApi, PatternConfig } from '../../ves-music-editor-types';

interface CurrentPatternProps {
    pattern: PatternConfig
    currentPattern: number
    stateApi: MusicEditorStateApi
}

export default function CurrentPattern(props: CurrentPatternProps): JSX.Element {
    const { currentPattern, pattern, stateApi } = props;

    return <div className='section currentPattern'>
        <VContainer>
            <label>Pattern: {currentPattern + 1}</label>
        </VContainer>

        <VContainer>
            Size
            <select
                className='theia-select'
                onChange={e => {
                    stateApi.setPatternSize(parseInt(e.target.value));
                    e.stopPropagation();
                }}
                value={pattern.size}
            >
                <option value={16}>16</option>
                <option value={32}>32</option>
                <option value={64}>64</option>
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
