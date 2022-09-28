import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import React from 'react';
import VContainer from '../../../../core/browser/components/VContainer';
import { ChannelConfig, MusicEditorStateApi, PatternConfig } from '../../ves-music-editor-types';

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
            <SelectComponent
                options={channel.patterns.map((n, i) => ({
                    value: i.toString(),
                    label: (i + 1).toString()
                }))}
                defaultValue={currentPattern.toString()}
                onChange={option => stateApi.setCurrentPattern(channel.id, parseInt(option.value!))}
            />
        </VContainer>

        <VContainer>
            Size
            <SelectComponent
                options={[
                    { value: '16', label: '16' },
                    { value: '32', label: '32' },
                    { value: '64', label: '64' },
                ]}
                defaultValue={pattern.size.toString()}
                onChange={option => stateApi.setPatternSize(parseInt(option.value!))}
            />
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
